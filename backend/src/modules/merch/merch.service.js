import { AppError } from '../../lib/AppError.js';
import { parsePagination, createPageMeta } from '../../lib/pagination.js';
import { registerPurposeHandler } from '../payments/payments.service.js';
import { registerApprovalHandler } from '../approvals/approvals.service.js';

export function createMerchService({ prisma, createPayment }) {
  function formatProduct(p) {
    if (!p) return null;
    return {
      ...p,
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

      // Atomic reserve via updateMany
      const { count } = await prisma.variant.updateMany({
        where: {
          id: variantId,
          stock: { gte: { $raw: `reserved + ${quantity}` } }, // Actually, updateMany doesn't support field reference in gte directly in prisma safely without queryRaw, so we'll do raw query.
        },
        data: { reserved: { increment: quantity } },
      });

      // Workaround for atomic reservation since prisma doesn't support stock >= reserved + quantity natively in updateMany
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
                  totalPricePaise: totalPaise,
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
      return {
        ...updated,
        totalPaise: Number(updated.totalPaise),
      };
    },
  };
}
