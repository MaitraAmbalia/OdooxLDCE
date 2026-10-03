import { AppError } from '../../lib/AppError.js';

export function createMerchService({ prisma }) {
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

  return {
    async listProducts() {
      const products = await prisma.product.findMany({
        include: {
          variants: true,
        },
      });

      return products.map(formatProduct);
    },

    async getProduct(id) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { variants: true },
      });
      if (!product) throw new AppError('NOT_FOUND', 404, 'Product not found');
      return formatProduct(product);
    },

    async createOrder(userId, { variantId, quantity = 1 }) {
      const variant = await prisma.variant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });

      if (!variant) throw new AppError('NOT_FOUND', 404, 'Product variant not found');
      const available = (variant.stock ?? 0) - (variant.reserved ?? 0);
      if (available < quantity) {
        throw new AppError('OUT_OF_STOCK', 400, 'Selected size is currently out of stock');
      }

      return prisma.$transaction(async (tx) => {
        // Reserve stock
        await tx.variant.update({
          where: { id: variantId },
          data: { reserved: { increment: quantity } },
        });

        // Calculate price based on member price
        const pricePaise = variant.product?.memberPricePaise ?? BigInt(50000);
        const totalPaise = BigInt(pricePaise) * BigInt(quantity);

        const order = await tx.order.create({
          data: {
            userId,
            totalPaise,
            status: 'PAID', // For hackathon demo instant checkout
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

        return {
          ...order,
          totalPaise: Number(order.totalPaise),
        };
      });
    },

    async getUserOrders(userId) {
      const orders = await prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
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

      return orders.map((o) => ({
        ...o,
        totalPaise: Number(o.totalPaise),
      }));
    },
  };
}
