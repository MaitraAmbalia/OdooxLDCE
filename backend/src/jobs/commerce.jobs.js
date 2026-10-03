import { getPrismaClient } from '../db/prisma.js';
import { unlink } from 'node:fs/promises';
import path from 'node:path';

const prisma = getPrismaClient();
const TICKET_RESERVATION_MS = 10 * 60 * 1000;
const MERCH_RESERVATION_MS = 15 * 60 * 1000;

export async function releaseReservations() {
  const now = new Date();

  // 1. Release Tickets
  const expiredTickets = await prisma.ticket.findMany({
    where: {
      status: 'RESERVED',
      createdAt: { lt: new Date(now.getTime() - TICKET_RESERVATION_MS) },
    },
  });

  for (const ticket of expiredTickets) {
    await prisma.$transaction(async (tx) => {
      // Re-check inside tx to avoid race conditions
      const t = await tx.ticket.findUnique({ where: { id: ticket.id } });
      if (t.status !== 'RESERVED') return;

      await tx.ticket.delete({ where: { id: t.id } });
      
      await tx.ticketType.update({
        where: { id: t.ticketTypeId },
        data: { sold: { decrement: 1 } },
      });
      await tx.event.update({
        where: { id: t.eventId },
        data: { seatsSold: { decrement: 1 } },
      });
    });
  }

  // 2. Release Merch Orders
  const expiredMerch = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: new Date(now.getTime() - MERCH_RESERVATION_MS) },
    },
    include: { items: true },
  });

  for (const order of expiredMerch) {
    await prisma.$transaction(async (tx) => {
      const o = await tx.order.findUnique({ where: { id: order.id } });
      if (o.status !== 'PENDING') return;

      await tx.order.update({
        where: { id: o.id },
        data: { status: 'CANCELLED' },
      });

      for (const item of order.items) {
        await tx.$executeRaw`
          UPDATE variants
          SET reserved = reserved - ${item.quantity}
          WHERE id = ${item.variantId}::uuid
        `;
      }
    });
  }
}

export async function expireMemberships() {
  const now = new Date();
  await prisma.membership.updateMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lt: now },
    },
    data: {
      status: 'LAPSED',
    },
  });
}

export async function closeEvents() {
  const now = new Date();
  await prisma.event.updateMany({
    where: {
      status: 'PUBLISHED',
      endAt: { lt: now },
    },
    data: {
      status: 'COMPLETED',
    },
  });
}

export async function cleanupUnattachedFiles(config) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const orphans = await prisma.file.findMany({
    where: {
      attachedToType: null,
      createdAt: { lt: oneHourAgo },
    },
  });

  const root = path.resolve(config.fileStoragePath ?? './storage');
  
  for (const file of orphans) {
    await prisma.file.delete({ where: { id: file.id } });
    await unlink(path.join(root, file.storageKey)).catch(() => {});
  }
}
