import { AppError } from '../../lib/AppError.js';
import { parsePagination, createPageMeta } from '../../lib/pagination.js';

export function createTicketsService({ prisma }) {
  return {
    async buyTicket(userId, { eventId, ticketTypeId }) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { ticketTypes: true },
      });
      if (!event) throw new AppError('NOT_FOUND', 404, 'Event was not found');

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

        return {
          ...ticket,
          pricePaidPaise: Number(ticket.pricePaidPaise),
        };
      });
    },

    async getTicketById(id) {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          event: { select: { id: true, title: true, venue: true, startAt: true, endAt: true } },
          ticketType: { select: { name: true } },
          user: { select: { id: true, name: true, studentId: true } },
        },
      });
      if (!ticket) throw new AppError('NOT_FOUND', 404, 'Ticket was not found');
      return {
        ...ticket,
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

    async checkIn(doorVolunteerId, ticketId, expectedEventId) {
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
        ticketId: updated.id,
        status: updated.status,
        checkedInAt: updated.checkedInAt,
        attendeeName: ticket.user.name,
        studentId: ticket.user.studentId,
        eventTitle: ticket.event.title,
      };
    },
  };
}
