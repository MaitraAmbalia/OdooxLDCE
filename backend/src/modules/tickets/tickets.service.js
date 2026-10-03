import { AppError } from '../../lib/AppError.js';
import { parsePagination, createPageMeta } from '../../lib/pagination.js';
import { sealQr, openQr } from '../../lib/qrToken.js';
import { notify } from '../../lib/notify.js';

const TICKET_QR = /^t:([0-9a-f-]{36})$/;

export function createTicketsService({ prisma, config }) {
  return {
    async buyTicket(userId, { eventId, ticketTypeId }) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { ticketTypes: true },
      });
      if (!event) throw new AppError('NOT_FOUND', 404, 'Event was not found');
      // Tickets go on sale only after Mentor authorization publishes the event.
      if (event.status !== 'PUBLISHED') throw new AppError('EVENT_NOT_ON_SALE', 409, 'Tickets for this event are not on sale');

      const ticketType = event.ticketTypes.find((t) => t.id === ticketTypeId);
      if (!ticketType) throw new AppError('NOT_FOUND', 404, 'Ticket type was not found');

      if (ticketType.sold >= ticketType.quota) {
        throw new AppError('SOLD_OUT', 400, 'Ticket quota sold out');
      }

      return prisma.$transaction(async (tx) => {
        // Increment sold count
        await tx.ticketType.update({
          where: { id: ticketTypeId },
          data: { sold: { increment: 1 } },
        });

        await tx.event.update({
          where: { id: eventId },
          data: { seatsSold: { increment: 1 } },
        });

        // Create issued ticket
        const ticket = await tx.ticket.create({
          data: {
            eventId,
            ticketTypeId,
            userId,
            pricePaidPaise: ticketType.pricePaise,
            status: 'ISSUED',
          },
          include: {
            event: { select: { title: true, venue: true, startAt: true } },
            ticketType: { select: { name: true } },
          },
        });

        await notify(tx, {
          userId,
          type: 'TICKET_ISSUED',
          title: 'Your pass is ready',
          body: `${ticket.ticketType.name} for "${ticket.event.title}".`,
          link: `/me/tickets/${ticket.id}`,
        });

        return {
          ...ticket,
          pricePaidPaise: Number(ticket.pricePaidPaise),
        };
      });
    },

    // Owner-only; 404 (not 403) for other users' tickets so ids can't be probed.
    async getTicketById(userId, id) {
      const ticket = await prisma.ticket.findFirst({
        where: { id, userId },
        include: {
          event: { select: { id: true, title: true, venue: true, startAt: true, endAt: true } },
          ticketType: { select: { name: true } },
          user: { select: { id: true, name: true, studentId: true } },
        },
      });
      if (!ticket) throw new AppError('NOT_FOUND', 404, 'Ticket was not found');
      return {
        ...ticket,
        qr: sealQr(config.cardQrSecret, `t:${ticket.id}`),
        pricePaidPaise: Number(ticket.pricePaidPaise),
        event: ticket.event
          ? {
              ...ticket.event,
              startDate: ticket.event.startAt,
            }
          : ticket.event,
      };
    },

    async getUserTickets(userId, query = {}) {
      const page = parsePagination(query, { defaultLimit: 50 });
      const where = { userId };

      const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: page.skip,
          take: page.take,
          include: {
            event: { select: { title: true, venue: true, startAt: true, endAt: true } },
            ticketType: { select: { name: true } },
          },
        }),
        prisma.ticket.count({ where }),
      ]);

      const data = tickets.map((t) => ({
        ...t,
        pricePaidPaise: Number(t.pricePaidPaise),
        event: t.event
          ? {
              ...t.event,
              startDate: t.event.startAt,
            }
          : t.event,
      }));

      return { data, meta: createPageMeta(page, total) };
    },

    async checkIn(doorVolunteerId, qr, expectedEventId) {
      const ticketId = TICKET_QR.exec(openQr(config.cardQrSecret, qr) ?? '')?.[1];
      if (!ticketId) throw new AppError('INVALID_TICKET', 400, 'This QR code is not a valid ticket');
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          user: { select: { name: true, studentId: true } },
          event: { select: { title: true } },
        },
      });

      if (!ticket) throw new AppError('NOT_FOUND', 404, 'Ticket was not found');
      if (expectedEventId && ticket.eventId !== expectedEventId) {
        throw new AppError('WRONG_EVENT', 400, 'This ticket belongs to a different event');
      }
      if (ticket.status === 'CHECKED_IN') {
        throw new AppError('ALREADY_CHECKED_IN', 409, 'Ticket was already checked in', {
          checkedInAt: ticket.checkedInAt,
        });
      }
      if (ticket.status !== 'ISSUED') {
        throw new AppError('INVALID_TICKET_STATUS', 400, `Ticket cannot be checked in from ${ticket.status}`);
      }

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'CHECKED_IN',
          checkedInAt: new Date(),
          checkedInById: doorVolunteerId,
        },
      });

      return {
        status: updated.status,
        checkedInAt: updated.checkedInAt,
        attendeeName: ticket.user.name,
        studentId: ticket.user.studentId,
        eventTitle: ticket.event.title,
      };
    },
  };
}
