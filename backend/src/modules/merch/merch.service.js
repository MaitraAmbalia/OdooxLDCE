import { AppError } from '../../lib/AppError.js';

export function createMerchService({ prisma }) {
  return {
    async listProducts() {
      const products = await prisma.product.findMany({
        include: {
          variants: true,
        },
      });

      return products.map((p) => ({
        ...p,
        variants: p.variants.map((v) => ({
          ...v,
          stockAvailable: v.stockOnHand - v.reservedStock,
        })),
      }));
    },

    async getProduct(id) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { variants: true },
      });
      if (!product) throw new AppError('NOT_FOUND', 404, 'Product not found');
      return {
        ...product,
        variants: product.variants.map((v) => ({
          ...v,
          stockAvailable: v.stockOnHand - v.reservedStock,
        })),
      };
    },

    async createOrder(userId, { variantId, quantity = 1 }) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });

      if (!variant) throw new AppError('NOT_FOUND', 404, 'Product variant not found');
      if (variant.stockOnHand - variant.reservedStock < quantity) {
        throw new AppError('OUT_OF_STOCK', 400, 'Selected size is currently out of stock');
      }

      return prisma.$transaction(async (tx) => {
        // Reserve stock
        await tx.productVariant.update({
          where: { id: variantId },
          data: { reservedStock: { increment: quantity } },
        });

        // Calculate price
        const pricePaise = BigInt(50000); // Default ₹500
        const totalPaise = pricePaise * BigInt(quantity);

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
                  pricePaise,
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
