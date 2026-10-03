import { AppError } from '../../lib/AppError.js';
import { parsePagination, createPageMeta } from '../../lib/pagination.js';
import { sealQr, openQr } from '../../lib/qrToken.js';
import { notify } from '../../lib/notify.js';
import { registerPurposeHandler } from '../payments/payments.service.js';
import { canWorkDoor } from '../events/events.service.js';

const TICKET_QR = /^t:([0-9a-f-]{36})$/;

const HOLD_MS = 15 * 60 * 1000; // a paid ticket's seat is held this long while the buyer pays

export function createTicketsService({ prisma, config, createPayment }) {
  const isActiveMember = async (userId) =>
    (await prisma.membership.count({ where: { userId, status: 'ACTIVE', expiresAt: { gt: new Date() } } })) > 0;

  // Take one seat from the ticket type and the event, or fail if either is full (atomic, no oversell).
  async function takeSeat(tx, ticketType) {
    const tt = await tx.ticketType.updateMany({ where: { id: ticketType.id, sold: { lt: prisma.ticketType.fields.quota } }, data: { sold: { increment: 1 } } });
    if (!tt.count) throw new AppError('SOLD_OUT', 409, `${ticketType.name} tickets are sold out`);
    const ev = await tx.event.updateMany({ where: { id: ticketType.eventId, seatsSold: { lt: prisma.event.fields.capacity } }, data: { seatsSold: { increment: 1 } } });
    if (!ev.count) throw new AppError('SOLD_OUT', 409, 'This event is at full capacity');
  }
  const releaseSeat = async (tx, ticketType) => {
    await tx.ticketType.update({ where: { id: ticketType.id }, data: { sold: { decrement: 1 } } });
    await tx.event.update({ where: { id: ticketType.eventId }, data: { seatsSold: { decrement: 1 } } });
  };

  async function issue(tx, { userId, ticketType, paymentId = null }) {
    const ticket = await tx.ticket.create({
      data: { eventId: ticketType.eventId, ticketTypeId: ticketType.id, userId, pricePaidPaise: ticketType.pricePaise, status: 'ISSUED', paymentId },
      include: { event: { select: { title: true, venue: true, startAt: true } }, ticketType: { select: { name: true } } },
    });
    await notify(tx, { userId, type: 'TICKET_ISSUED', title: 'Your pass is ready', body: `${ticket.ticketType.name} for "${ticket.event.title}".`, link: `/me/tickets/${ticket.id}` });
    return { ...ticket, pricePaidPaise: Number(ticket.pricePaidPaise) };
  }

  // Abandoned checkouts give their seat back once the hold expires (checked lazily on the next purchase).
  async function releaseExpiredHolds(ticketTypeId) {
    const stale = await prisma.ticketReservation.findMany({
      where: { ticketTypeId, status: 'HELD', expiresAt: { lt: new Date() }, OR: [{ paymentId: null }, { payment: { status: { not: 'PAID' } } }] },
      include: { ticketType: true },
    });
    for (const r of stale) {
      await prisma.$transaction(async (tx) => {
        const { count } = await tx.ticketReservation.updateMany({ where: { id: r.id, status: 'HELD' }, data: { status: 'RELEASED' } });
        if (count) await releaseSeat(tx, r.ticketType);
      });
    }
  }

  // Paid ticket: the payment's refId is the reservation.
  registerPurposeHandler('TICKET', async (payment, tx) => {
    const r = await tx.ticketReservation.findUnique({ where: { id: payment.refId }, include: { ticketType: true } });
    if (!r || r.status === 'CONVERTED') return;
    if (r.status === 'RELEASED') {
      // Paid after the hold expired: take the seat again if one is left.
      // ponytail: if it sold out meanwhile the ticket is still issued (slight oversell), refund by hand if needed.
      await takeSeat(tx, r.ticketType).catch(() => {});
    }
    await tx.ticketReservation.update({ where: { id: r.id }, data: { status: 'CONVERTED' } });
    await issue(tx, { userId: r.userId, ticketType: r.ticketType, paymentId: payment.id });
    return { eventId: r.ticketType.eventId };
  }, {
    onFailed: async (payment, tx) => {
      const r = await tx.ticketReservation.findUnique({ where: { id: payment.refId }, include: { ticketType: true } });
      const { count } = await tx.ticketReservation.updateMany({ where: { id: payment.refId, status: 'HELD' }, data: { status: 'RELEASED' } });
      if (count) await releaseSeat(tx, r.ticketType);
    },
  });

  return {
    // Free tickets are issued at once; paid ones hold a seat and return a payment to complete.
    async buyTicket(userId, { eventId, ticketTypeId }, idempotencyKey) {
      const event = await prisma.event.findUnique({ where: { id: eventId }, include: { ticketTypes: true } });
      if (!event) throw new AppError('NOT_FOUND', 404, 'Event was not found');
      // Tickets go on sale only after Mentor authorization publishes the event.
      if (event.status !== 'PUBLISHED') throw new AppError('EVENT_NOT_ON_SALE', 409, 'Tickets for this event are not on sale');
      const ticketType = event.ticketTypes.find((t) => t.id === ticketTypeId);
      if (!ticketType) throw new AppError('NOT_FOUND', 404, 'Ticket type was not found');

      const now = new Date();
      if (now < ticketType.salesStartAt || now > ticketType.salesEndAt) throw new AppError('SALES_CLOSED', 409, `${ticketType.name} tickets are not on sale right now`);

      // Tiered pricing: the member tier needs an active membership; members always get the member price.
      const member = await isActiveMember(userId);
      if ((ticketType.audience === 'MEMBER' || event.visibility === 'MEMBERS_ONLY') && !member) {
        throw new AppError('MEMBERSHIP_REQUIRED', 403, 'This ticket is for active members only');
      }
      if (ticketType.audience === 'NON_MEMBER' && member && event.ticketTypes.some((t) => t.audience === 'MEMBER')) {
        throw new AppError('MEMBER_PRICE_APPLIES', 409, 'You are a member, so please choose the member ticket');
      }

      await releaseExpiredHolds(ticketTypeId);
      const [owned, held] = await Promise.all([
        prisma.ticket.count({ where: { userId, ticketTypeId, status: { in: ['ISSUED', 'CHECKED_IN'] } } }),
        prisma.ticketReservation.count({ where: { userId, ticketTypeId, status: 'HELD' } }),
      ]);
      if (owned + held >= ticketType.maxPerUser) {
        throw new AppError('TICKET_LIMIT_REACHED', 409, `You can hold at most ${ticketType.maxPerUser} ${ticketType.name} ticket${ticketType.maxPerUser === 1 ? '' : 's'}`);
      }

      const amountPaise = Number(ticketType.pricePaise);
      if (amountPaise === 0) {
        const ticket = await prisma.$transaction(async (tx) => {
          await takeSeat(tx, ticketType);
          return issue(tx, { userId, ticketType });
        });
        return { ...ticket, payment: null };
      }

      const reservation = await prisma.$transaction(async (tx) => {
        await takeSeat(tx, ticketType);
        return tx.ticketReservation.create({ data: { ticketTypeId, userId, quantity: 1, expiresAt: new Date(Date.now() + HOLD_MS) } });
      });
      try {
        const payment = await createPayment({ userId, purpose: 'TICKET', refId: reservation.id, amountPaise, idempotencyKey });
        await prisma.ticketReservation.update({ where: { id: reservation.id }, data: { paymentId: payment.paymentId } });
        return { reservationId: reservation.id, payment };
      } catch (e) {
        // Gateway down: give the seat back straight away.
        await prisma.$transaction(async (tx) => {
          await tx.ticketReservation.update({ where: { id: reservation.id }, data: { status: 'RELEASED' } });
          await releaseSeat(tx, ticketType);
        });
        throw e;
      }
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

    async checkIn(user, qr, expectedEventId) {
      const raw = String(qr ?? '').trim();
      let ticketId = TICKET_QR.exec(openQr(config.cardQrSecret, raw) ?? '')?.[1];
      if (!ticketId && /^[0-9a-f-]{36}$/i.test(raw)) {
        ticketId = raw;
      }
      if (!ticketId) throw new AppError('INVALID_TICKET', 400, 'This QR code or pass code is not a valid ticket');
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          user: { select: { name: true, studentId: true } },
          event: { select: { title: true } },
        },
      });

      if (!ticket) throw new AppError('NOT_FOUND', 404, 'Ticket was not found');
      // Leaders with ticket.checkin, or volunteers on this event's door during the event.
      if (!(await canWorkDoor(prisma, user, expectedEventId ?? ticket.eventId))) {
        throw new AppError('FORBIDDEN', 403, 'You do not have door access for this event');
      }
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
          checkedInById: user.id,
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
