import { getPrismaClient } from '../../db/prisma.js';

export function createCommerceSubscribers({ prisma = getPrismaClient() } = {}) {
  return {
    async onUserDisabled({ userId }) {
      await prisma.$transaction(async (tx) => {
        // 1. Release active ticket reservations
        const tickets = await tx.ticket.findMany({ where: { userId, status: 'RESERVED' } });
        for (const t of tickets) {
          await tx.ticket.delete({ where: { id: t.id } });
          await tx.ticketType.update({ where: { id: t.ticketTypeId }, data: { sold: { decrement: 1 } } });
          await tx.event.update({ where: { id: t.eventId }, data: { seatsSold: { decrement: 1 } } });
        }

        // 2. Release active merch reservations
        const orders = await tx.order.findMany({ where: { userId, status: 'PENDING' }, include: { items: true } });
        for (const o of orders) {
          await tx.order.update({ where: { id: o.id }, data: { status: 'CANCELLED' } });
          for (const item of o.items) {
            await tx.$executeRaw`UPDATE variants SET reserved = reserved - ${item.quantity} WHERE id = ${item.variantId}::uuid`;
          }
        }

        // 3. Revoke active/future staff rows
        await tx.eventDoorStaff.deleteMany({ where: { volunteerId: userId, event: { endAt: { gte: new Date() } } } });
        await tx.cashDeskStaff.deleteMany({ where: { volunteerId: userId, shiftEnd: { gte: new Date() } } });
      });
    },

    async onVolunteerDeactivated({ userId }) {
      await prisma.$transaction(async (tx) => {
        // 1. Revoke active/future staff rows
        await tx.eventDoorStaff.deleteMany({ where: { volunteerId: userId, event: { endAt: { gte: new Date() } } } });
        await tx.cashDeskStaff.deleteMany({ where: { volunteerId: userId, shiftEnd: { gte: new Date() } } });
      });
    }
  };
}
