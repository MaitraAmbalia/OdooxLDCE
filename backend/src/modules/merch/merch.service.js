import { AppError } from '../../lib/AppError.js';
import { parsePagination, createPageMeta } from '../../lib/pagination.js';
import { registerPurposeHandler } from '../payments/payments.service.js';
import { registerApprovalHandler } from '../approvals/approvals.service.js';
import { notify } from '../../lib/notify.js';

export function createMerchService({ prisma, createPayment }) {
  const DEFAULT_MERCH_ASSETS = {
    '00000000-0000-0000-0000-000000000002': { cover: '/merch/hoodie.jpg', images: ['/merch/hoodie.jpg'] },
    '40000000-0000-0000-0000-000000000002': { cover: '/merch/tee.jpg', images: ['/merch/tee.jpg'] },
    '40000000-0000-0000-0000-000000000003': { cover: '/merch/flask.jpg', images: ['/merch/flask.jpg'] },
    '40000000-0000-0000-0000-000000000004': { cover: '/merch/cap.jpg', images: ['/merch/cap.jpg'] },
    '40000000-0000-0000-0000-000000000005': { cover: '/merch/stickers.jpg', images: ['/merch/stickers.jpg'] },
  };

  function resolveProductImages(p) {
    if (DEFAULT_MERCH_ASSETS[p.id]) return DEFAULT_MERCH_ASSETS[p.id];
    const name = (p.name || '').toLowerCase();
    if (name.includes('hoodie')) return { cover: '/merch/hoodie.jpg', images: ['/merch/hoodie.jpg'] };
    if (name.includes('tee') || name.includes('t-shirt')) return { cover: '/merch/tee.jpg', images: ['/merch/tee.jpg'] };
    if (name.includes('flask') || name.includes('bottle')) return { cover: '/merch/flask.jpg', images: ['/merch/flask.jpg'] };
    if (name.includes('cap') || name.includes('hat')) return { cover: '/merch/cap.jpg', images: ['/merch/cap.jpg'] };
    if (name.includes('sticker')) return { cover: '/merch/stickers.jpg', images: ['/merch/stickers.jpg'] };
    return { cover: '/merch/hoodie.jpg', images: ['/merch/hoodie.jpg'] };
  }

  function formatProduct(p) {
    if (!p) return null;
    const resolved = resolveProductImages(p);
    const dbImages = (p.images || []).map((img) => (img.file?.storageKey ? `/api/v1/files/${img.fileId}` : img.url)).filter(Boolean);
    const coverImageUrl = p.coverImageUrl || (dbImages.length ? dbImages[0] : resolved.cover);
    const images = dbImages.length ? dbImages : resolved.images;

    return {
      ...p,
      coverImageUrl,
      images,
      memberPricePaise: Number(p.memberPricePaise ?? 0),
      nonMemberPricePaise: Number(p.nonMemberPricePaise ?? 0),
      variants: (p.variants || []).map((v) => ({
        ...v,
        stockAvailable: Math.max(0, (v.stock ?? 0) - (v.reserved ?? 0)),
      })),
    };
  }

  // Register approval handler for MERCH_PRICE
  registerApprovalHandler('MERCH_PRICE', async (approval, tx) => {
    const { memberPricePaise, nonMemberPricePaise } = approval.proposedValue;
    await tx.product.update({
      where: { id: approval.targetId },
      data: {
        memberPricePaise: BigInt(memberPricePaise),
        nonMemberPricePaise: BigInt(nonMemberPricePaise),
        status: 'ACTIVE',
      },
    });
  });

  // Register payment handlers
  registerPurposeHandler(
    'MERCH_ORDER',
    async (payment, tx) => {
      const order = await tx.order.findUnique({
        where: { paymentId: payment.id },
        include: { items: true },
      });
      if (!order) return;

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });

      // Create stock adjustment and commit stock (append-only)
      for (const item of order.items) {
        // Stock moves: actually decrement stock and decrement reserved
        await tx.variant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity },
            reserved: { decrement: item.quantity },
          },
        });
        await tx.stockAdjustment.create({
          data: {
            variantId: item.variantId,
            delta: -item.quantity,
            reason: `Order ${order.id} paid`,
            adjustedById: order.userId,
          },
        });
      }
      // TODO: publish order.paid
    },
    {
      onFailed: async (payment, tx) => {
        const order = await tx.order.findUnique({
          where: { paymentId: payment.id },
          include: { items: true },
        });
        if (!order) return;

        await tx.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        });

        // Release reservation
        for (const item of order.items) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { reserved: { decrement: item.quantity } },
          });
        }
      },
    }
  );

  return {
    async listProducts(query = {}) {
      const page = parsePagination(query, { defaultLimit: 50 });
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          skip: page.skip,
          take: page.take,
          include: {
            variants: true,
          },
        }),
        prisma.product.count(),
      ]);

      return {
        data: products.map(formatProduct),
        meta: createPageMeta(page, total),
      };
    },

    async getProduct(id) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { variants: true },
      });
      if (!product) throw new AppError('NOT_FOUND', 404, 'Product not found');
      return formatProduct(product);
    },

    async createOrder(userId, { variantId, quantity = 1, idempotencyKey }) {
      if (!createPayment) throw new AppError('NOT_CONFIGURED', 500, 'Payments not configured');

      const variant = await prisma.variant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });

      if (!variant) throw new AppError('NOT_FOUND', 404, 'Product variant not found');

      // Atomic reservation via raw SQL
      const rows = await prisma.$executeRaw`
        UPDATE variants
        SET reserved = reserved + ${quantity}
        WHERE id = ${variantId}::uuid AND (stock - reserved) >= ${quantity}
      `;
      if (rows === 0) {
        throw new AppError('OUT_OF_STOCK', 400, 'Selected size is currently out of stock');
      }

      // Calculate price based on member price (TODO: snapshot from token membership)
      const pricePaise = variant.product?.memberPricePaise ?? BigInt(50000);
      const totalPaise = BigInt(pricePaise) * BigInt(quantity);

      const reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute reservation

      const order = await prisma.$transaction(async (tx) => {
        const o = await tx.order.create({
          data: {
            userId,
            totalPaise,
            status: 'PENDING_PAYMENT',
            reservationExpiresAt,
            items: {
              create: [
                {
                  variantId,
                  quantity,
                  unitPricePaise: pricePaise,
                },
              ],
            },
          },
          include: { items: true },
        });

        const payment = await createPayment({
          userId,
          purpose: 'MERCH_ORDER',
          refId: o.id,
          amountPaise: Number(totalPaise),
          idempotencyKey,
        });

        const updatedOrder = await tx.order.update({
          where: { id: o.id },
          data: { paymentId: payment.paymentId },
          include: {
            items: {
              include: {
                variant: {
                  include: { product: true },
                },
              },
            },
          },
        });

        return { ...updatedOrder, payment };
      });

      return {
        ...order,
        totalPaise: Number(order.totalPaise),
        items: order.items.map((item) => ({
          ...item,
          unitPricePaise: Number(item.unitPricePaise),
          variant: item.variant
            ? {
                ...item.variant,
                product: item.variant.product ? formatProduct(item.variant.product) : null,
              }
            : null,
        })),
        payment: order.payment
          ? {
              ...order.payment,
              amountPaise: Number(order.payment.amountPaise),
            }
          : null,
      };
    },

    async getUserOrders(userId, query = {}) {
      const page = parsePagination(query, { defaultLimit: 20 });
      const where = { userId };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: page.skip,
          take: page.take,
          include: {
            items: {
              include: {
                variant: {
                  include: { product: true },
                },
              },
            },
          },
        }),
        prisma.order.count({ where }),
      ]);

      const data = orders.map((o) => ({
        ...o,
        totalPaise: Number(o.totalPaise),
        items: o.items.map((item) => ({
          ...item,
          unitPricePaise: Number(item.unitPricePaise),
          name: item.variant?.product?.name || 'Merchandise',
          variant: [item.variant?.size, item.variant?.color].filter(Boolean).join(' · ') || item.variant?.sku || 'Standard',
        })),
      }));

      return { data, meta: createPageMeta(page, total) };
    },

    async listOrders(query = {}) {
      const page = parsePagination(query, { defaultLimit: 50 });
      const allowedStatuses = ['PAID', 'READY', 'COLLECTED'];
      const where = allowedStatuses.includes(query.status) ? { status: query.status } : { status: { in: allowedStatuses } };
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: 'asc' },
          skip: page.skip,
          take: page.take,
          include: {
            user: { select: { id: true, name: true, studentId: true } },
            items: { include: { variant: { include: { product: true } } } },
          },
        }),
        prisma.order.count({ where }),
      ]);

      return {
        data: orders.map((order) => ({
          ...order,
          totalPaise: Number(order.totalPaise),
          items: order.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            unitPricePaise: Number(item.unitPricePaise),
            name: item.variant?.product?.name || 'Merchandise',
            variant: [item.variant?.size, item.variant?.color].filter(Boolean).join(' · ') || item.variant?.sku || 'Standard',
          })),
        })),
        meta: createPageMeta(page, total),
      };
    },

    async updateOrderStatus(userId, orderId, nextStatus) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new AppError('NOT_FOUND', 404, 'Order not found');
      const expected = order.status === 'PAID' ? 'READY' : order.status === 'READY' ? 'COLLECTED' : null;
      if (!expected || nextStatus !== expected) {
        throw new AppError('INVALID_STATUS_TRANSITION', 400, `Order cannot move from ${order.status} to ${nextStatus}`);
      }
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: nextStatus === 'COLLECTED'
          ? { status: nextStatus, collectedAt: new Date(), collectedById: userId }
          : { status: nextStatus },
      });
      if (nextStatus === 'READY') {
        await notify(prisma, {
          userId: order.userId,
          type: 'MERCH_READY',
          title: 'Merch ready for pickup',
          body: `Your order #${order.id.slice(0, 8).toUpperCase()} is ready for pickup at the campus merch desk.`,
          link: '/me/orders',
        }).catch(() => {});
      }
      return {
        ...updated,
        totalPaise: Number(updated.totalPaise),
      };
    },
  };
}
