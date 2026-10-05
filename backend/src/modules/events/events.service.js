import { AppError } from '../../lib/AppError.js';
import { parsePagination, createPageMeta } from '../../lib/pagination.js';
import { notify, notifyMany } from '../../lib/notify.js';

export const EVENT_LEADS = ['event.approve', 'event.propose', 'event.publish'];
const REVIEWABLE = ['PENDING_APPROVAL', 'CHANGES_REQUESTED'];
const DECISION_STATUS = { APPROVE: 'PUBLISHED', REQUEST_CHANGES: 'CHANGES_REQUESTED', REJECT: 'REJECTED' };
const EDITABLE = ['DRAFT', 'PENDING_APPROVAL', 'CHANGES_REQUESTED'];
// Door access opens 6h before the event and closes 6h after it ends.
const DOOR_WINDOW_MS = 6 * 3600 * 1000;

const eventFields = (e) => ({
  title: e.title, description: e.description, category: e.category ?? 'GENERAL', venue: e.venue,
  startAt: new Date(e.startAt), endAt: new Date(e.endAt), capacity: e.capacity, visibility: e.visibility ?? 'PUBLIC',
});
const ticketTypeData = (t, event) => ({
  name: t.name, audience: t.audience ?? 'ALL', pricePaise: BigInt(t.pricePaise ?? 0), quota: t.quota ?? event.capacity,
  maxPerUser: t.maxPerUser ?? 5,
  // Sales open now (the event is only buyable once PUBLISHED anyway) and close when it starts.
  salesStartAt: new Date(t.salesStartAt ?? Date.now()), salesEndAt: new Date(t.salesEndAt ?? event.startAt),
});
const budgetLineData = (b) => ({ category: b.category, amountPaise: BigInt(b.amountPaise), note: b.note ?? null });

const resolveCoverUrl = (e) => {
  if (e.coverFileId) return `/api/v1/files/${e.coverFileId}`;
  const t = (e.title || '').toLowerCase();
  const c = (e.category || '').toUpperCase();

  if (t.includes('open mic') || t.includes('poetry') || t.includes('acoustic')) {
    return '/banners/open_mic_poetry.jpg';
  }
  if (t.includes('esport') || t.includes('valorant') || t.includes('gaming') || t.includes('bgmi')) {
    return '/banners/esports_championship.jpg';
  }
  if (t.includes('robowars') || t.includes('drone') || t.includes('combat robot') || t.includes('rocketry') || t.includes('aerospace')) {
    return '/banners/robowars_drones.jpg';
  }
  if (t.includes('cultural') || t.includes('raas') || t.includes('garba') || t.includes('dance') || t.includes('bands')) {
    return '/banners/cultural_night_raas.jpg';
  }
  if (t.includes('tedx') || t.includes('conclave') || (t.includes('symposium') && !t.includes('workshop'))) {
    return '/banners/tedx_talks.jpg';
  }
  if (t.includes('sports') || t.includes('clash of departments') || t.includes('cricket') || t.includes('football') || t.includes('athlete')) {
    return '/banners/sports_meet.jpg';
  }
  if (
    t.includes('workshop') ||
    t.includes('bootcamp') ||
    t.includes('full stack') ||
    t.includes('ai &') ||
    t.includes('machine learning') ||
    t.includes('fintech') ||
    t.includes('install-fest')
  ) {
    return '/banners/ai_workshop.jpg';
  }
  if (
    e.id === '30000000-0000-0000-0000-000000000002' ||
    t.includes('hackathon') ||
    t.includes('codewave') ||
    t.includes('ctf') ||
    t.includes('devfest')
  ) {
    return '/banners/codewave_hackathon_2026.jpg';
  }
  if (
    e.id === '00000000-0000-0000-0000-000000000001' ||
    t.includes('gala') ||
    t.includes('spring gala') ||
    t.includes('awards')
  ) {
    return '/banners/spring_gala_2026.jpg';
  }

  switch (c) {
    case 'GALA': return '/banners/spring_gala_2026.jpg';
    case 'HACKATHON': return '/banners/codewave_hackathon_2026.jpg';
    case 'COMPETITION': return '/banners/robowars_drones.jpg';
    case 'SPORTS': return '/banners/sports_meet.jpg';
    case 'CULTURAL': return '/banners/cultural_night_raas.jpg';
    case 'CONFERENCE': return '/banners/tedx_talks.jpg';
    case 'WORKSHOP':
    case 'ACADEMIC': return '/banners/ai_workshop.jpg';
    case 'SOCIAL': return '/banners/open_mic_poetry.jpg';
    case 'EXHIBITION': return '/banners/robowars_drones.jpg';
    default: return '/banners/spring_gala_2026.jpg';
  }
};

// BigInt is not JSON-serialisable; paise amounts fit in a Number.
const serialize = (e) => ({
  ...e,
  ...('approvedBudgetPaise' in e && { approvedBudgetPaise: e.approvedBudgetPaise != null ? Number(e.approvedBudgetPaise) : null }),
  ...('sponsorshipTargetPaise' in e && { sponsorshipTargetPaise: e.sponsorshipTargetPaise != null ? Number(e.sponsorshipTargetPaise) : null }),
  startDate: e.startAt,
  endDate: e.endAt,
  coverImageUrl: resolveCoverUrl(e),
  ticketTypes: e.ticketTypes?.map((t) => ({ ...t, pricePaise: Number(t.pricePaise) })),
  budgetLines: e.budgetLines?.map((b) => ({ ...b, amountPaise: Number(b.amountPaise) })),
  requestedBudgetPaise: e.budgetLines ? e.budgetLines.reduce((n, b) => n + Number(b.amountPaise), 0) : undefined,
});

// Net money spent on an event: OUT entries tagged to it, minus reversals of those.
export async function eventSpend(db, eventId) {
  const [row] = await db.$queryRaw`
    SELECT COALESCE(SUM(CASE WHEN direction = 'OUT' AND source_type <> 'REVERSAL' THEN amount_paise
                             WHEN direction = 'IN'  AND source_type =  'REVERSAL' THEN -amount_paise
                             ELSE 0 END), 0)::bigint AS spent
    FROM ledger_entries WHERE status = 'POSTED' AND event_id = ${eventId}::uuid`;
  return Number(row.spent);
}

// Leaders with ticket.checkin, or volunteers the Event Head put on this event's door (only around event time).
export async function canWorkDoor(db, user, eventId) {
  if (user.permissions?.includes('ticket.checkin')) return true;
  if (!/^[0-9a-f-]{36}$/i.test(eventId ?? '')) return false;
  const row = await db.eventDoorStaff.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
    include: { event: { select: { startAt: true, endAt: true } } },
  });
  const now = Date.now();
  return !!row && now >= row.event.startAt.getTime() - DOOR_WINDOW_MS && now <= row.event.endAt.getTime() + DOOR_WINDOW_MS;
}

function sponsorshipData(input) {
  const required = input.sponsorshipRequired === true;
  if (!required) {
    return {
      sponsorshipRequired: false,
      sponsorshipTargetPaise: null,
      sponsorshipDeadline: null,
      sponsorshipPitch: null,
      sponsorshipPackages: null,
      sponsorBenefits: null,
    };
  }

  const target = Number(input.sponsorshipTargetPaise);
  const deadline = new Date(input.sponsorshipDeadline);
  const packages = Array.isArray(input.sponsorshipPackages)
    ? input.sponsorshipPackages.map((value) => String(value).trim()).filter(Boolean)
    : [];
  const pitch = String(input.sponsorshipPitch || '').trim();
  const benefits = String(input.sponsorBenefits || '').trim();

  if (!Number.isSafeInteger(target) || target <= 0) {
    throw new AppError('VALIDATION_ERROR', 400, 'A positive sponsorship target is required');
  }
  if (Number.isNaN(deadline.getTime())) {
    throw new AppError('VALIDATION_ERROR', 400, 'A valid sponsorship deadline is required');
  }
  if (input.startAt && deadline >= new Date(input.startAt)) {
    throw new AppError('VALIDATION_ERROR', 400, 'The sponsorship deadline must be before the event starts');
  }
  if (!pitch || !benefits || packages.length === 0) {
    throw new AppError('VALIDATION_ERROR', 400, 'Sponsorship pitch, packages, and benefits are required');
  }

  return {
    sponsorshipRequired: true,
    sponsorshipTargetPaise: BigInt(target),
    sponsorshipDeadline: deadline,
    sponsorshipPitch: pitch,
    sponsorshipPackages: packages,
    sponsorBenefits: benefits,
  };
}

const withPublicAmounts = (event) => ({
  ...event,
  approvedBudgetPaise: event.approvedBudgetPaise != null ? Number(event.approvedBudgetPaise) : null,
  sponsorshipTargetPaise: event.sponsorshipTargetPaise != null ? Number(event.sponsorshipTargetPaise) : null,
});

export function createEventsService({ prisma }) {
  async function notifyMentors(event, what) {
    const mentors = await prisma.roleAssignment.findMany({ where: { role: 'MENTOR', endedAt: null }, select: { userId: true } });
    await notifyMany(prisma, mentors.map((m) => m.userId), {
      type: 'EVENT_PROPOSAL',
      title: 'Event proposal to review',
      body: `"${event.title}" ${what}`,
      link: `/manage/events/${event.id}/review`,
    });
  }

  return {
    // Proposals wait for Mentor authorization; tickets only go on sale once PUBLISHED.
    async create(userId, input) {
      const event = await prisma.event.create({
        data: {
          ...eventFields(input),
          status: 'PENDING_APPROVAL',
          proposedById: userId,
          ...sponsorshipData(input),
          ticketTypes: { create: (input.ticketTypes ?? []).map((t) => ticketTypeData(t, input)) },
          budgetLines: { create: (input.budgetLines ?? []).map(budgetLineData) },
        },
        include: { ticketTypes: true, budgetLines: true },
      });
      await notifyMentors(event, 'is waiting for your authorization.');
      return serialize(event);
    },

    // Edit a proposal (resubmits it for review), or adjust a live event's details/capacity.
    async update(user, id, input) {
      const event = await prisma.event.findUnique({ where: { id }, include: { ticketTypes: true } });
      if (!event) throw new AppError('NOT_FOUND', 404, 'Event was not found');
      if (event.proposedById !== user.id && !user.permissions?.includes('event.publish')) {
        throw new AppError('FORBIDDEN', 403, 'Only the proposer or an event leader can edit this event');
      }
      if (EDITABLE.includes(event.status)) {
        const merged = { ...event, ...input };
        if (new Date(merged.startAt) >= new Date(merged.endAt)) throw new AppError('VALIDATION_ERROR', 400, 'End time must be after the start time');
        const updated = await prisma.$transaction(async (tx) => {
          if (input.ticketTypes) {
            await tx.ticketType.deleteMany({ where: { eventId: id } }); // nothing is sold before publishing
            await tx.ticketType.createMany({ data: input.ticketTypes.map((t) => ({ ...ticketTypeData(t, merged), eventId: id })) });
          }
          if (input.budgetLines) {
            await tx.eventBudgetLine.deleteMany({ where: { eventId: id } });
            await tx.eventBudgetLine.createMany({ data: input.budgetLines.map((b) => ({ ...budgetLineData(b), eventId: id })) });
          }
          return tx.event.update({
            where: { id },
            data: { ...eventFields(merged), status: 'PENDING_APPROVAL' },
            include: { ticketTypes: true, budgetLines: true },
          });
        });
        if (event.status === 'CHANGES_REQUESTED') await notifyMentors(updated, 'was updated and resubmitted for review.');
        return serialize(updated);
      }
      if (event.status !== 'PUBLISHED') {
        throw new AppError('INVALID_STATE_TRANSITION', 409, `A ${event.status.toLowerCase().replaceAll('_', ' ')} event cannot be edited`);
      }
      // Live event: pricing and schedule were authorized by the Mentor, so only logistics change here.
      const locked = Object.keys(input).filter((k) => !['description', 'venue', 'capacity'].includes(k));
      if (locked.length) {
        throw new AppError('INVALID_STATE_TRANSITION', 409, `A published event's ${locked.join(', ')} can't be changed; only description, venue and capacity`);
      }
      if (input.capacity != null && input.capacity < event.seatsSold) {
        throw new AppError('VALIDATION_ERROR', 400, `Capacity cannot be below the ${event.seatsSold} seats already sold`);
      }
      const updated = await prisma.event.update({
        where: { id },
        data: { description: input.description, venue: input.venue, capacity: input.capacity },
        include: { ticketTypes: true, budgetLines: true },
      });
      return serialize(updated);
    },

    // Every event regardless of status, for the event console.
    async listManaged(user) {
      const mineOnly = !EVENT_LEADS.some((p) => user.permissions?.includes(p));
      const events = await prisma.event.findMany({
        where: mineOnly ? { proposedById: user.id } : {},
        orderBy: { createdAt: 'desc' },
        include: {
          ticketTypes: true,
          budgetLines: true,
          proposedBy: { select: { id: true, name: true } },
          reviews: { orderBy: { createdAt: 'desc' }, take: 1, include: { reviewer: { select: { name: true } } } },
          _count: { select: { tickets: { where: { status: 'CHECKED_IN' } } } },
        },
      });
      return events.map((e) => ({ ...serialize(e), checkedIn: e._count.tickets, latestReview: e.reviews[0] ?? null }));
    },

    // Post-event analytics: sales vs door check-ins per ticket type, revenue, budget use, and demographics.
    async report(id) {
      const event = await prisma.event.findUnique({ where: { id }, include: { ticketTypes: true, budgetLines: true } });
      if (!event) throw new AppError('NOT_FOUND', 404, 'Event was not found');
      const [byType, spend, committed, checkedInTickets] = await Promise.all([
        prisma.ticket.groupBy({
          by: ['ticketTypeId', 'status'],
          where: { eventId: id },
          _count: { _all: true },
          _sum: { pricePaidPaise: true },
        }),
        eventSpend(prisma, id),
        prisma.expenseClaim.groupBy({ by: ['status'], where: { eventId: id, status: { in: ['SUBMITTED', 'APPROVED_L1', 'APPROVED'] } }, _sum: { amountPaise: true } }),
        prisma.ticket.findMany({
          where: { eventId: id, status: 'CHECKED_IN' },
          include: { user: { select: { studentId: true, memberships: { select: { createdAt: true } } } } }
        })
      ]);
      const ticketTypes = event.ticketTypes.map((t) => {
        const rows = byType.filter((r) => r.ticketTypeId === t.id);
        const count = (statuses) => rows.filter((r) => statuses.includes(r.status)).reduce((n, r) => n + r._count._all, 0);
        const sold = count(['ISSUED', 'CHECKED_IN']);
        const checkedIn = count(['CHECKED_IN']);
        const revenuePaise = rows.filter((r) => ['ISSUED', 'CHECKED_IN'].includes(r.status)).reduce((n, r) => n + Number(r._sum.pricePaidPaise ?? 0), 0);
        return { id: t.id, name: t.name, audience: t.audience, pricePaise: Number(t.pricePaise), quota: t.quota, sold, checkedIn, noShows: sold - checkedIn, revenuePaise };
      });
      const sum = (k) => ticketTypes.reduce((n, t) => n + t[k], 0);
      const sold = sum('sold');
      const requestedPaise = event.budgetLines.reduce((n, b) => n + Number(b.amountPaise), 0);
      const approvedPaise = event.approvedBudgetPaise != null ? Number(event.approvedBudgetPaise) : null;
      // Committed = approved but not yet paid out; pending = still awaiting review.
      const claimSum = (statuses) => committed.filter((g) => statuses.includes(g.status)).reduce((n, g) => n + Number(g._sum.amountPaise ?? 0), 0);
      const committedPaise = claimSum(['APPROVED_L1', 'APPROVED']);

      // Analytics logic
      const timelineMap = {};
      const branchMap = {};
      const batchMap = {};
      let conversionCount = 0;

      for (const t of checkedInTickets) {
        if (!t.checkedInAt) continue;
        
        const min = t.checkedInAt.getMinutes();
        const block = Math.floor(min / 15) * 15;
        const timeKey = new Date(t.checkedInAt);
        timeKey.setMinutes(block, 0, 0);
        const tkStr = timeKey.toISOString();
        timelineMap[tkStr] = (timelineMap[tkStr] || 0) + 1;
        
        const sidMatch = t.user.studentId.match(/^(\d{2})([A-Z]+)\d+$/i);
        if (sidMatch) {
            const [, batch, branch] = sidMatch;
            const bYear = `20${batch}`;
            batchMap[bYear] = (batchMap[bYear] || 0) + 1;
            const br = branch.toUpperCase();
            branchMap[br] = (branchMap[br] || 0) + 1;
        }

        if (t.user.memberships?.length > 0) {
           const becameMemberAfter = t.user.memberships.some(m => new Date(m.createdAt) > new Date(event.startAt));
           if (becameMemberAfter) conversionCount++;
        }
      }

      const timeline = Object.entries(timelineMap).sort((a,b) => a[0].localeCompare(b[0])).map(([time, count]) => ({ time, count }));
      const demographics = {
          branches: Object.entries(branchMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count),
          batches: Object.entries(batchMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.name.localeCompare(a.name))
      };

      return {
        event: { id: event.id, title: event.title, status: event.status, startAt: event.startAt, endAt: event.endAt, venue: event.venue, capacity: event.capacity },
        ticketTypes,
        totals: { sold, checkedIn: sum('checkedIn'), noShows: event.endAt < new Date() ? sum('noShows') : null, revenuePaise: sum('revenuePaise'), capacity: event.capacity, checkInRate: sold ? sum('checkedIn') / sold : 0 },
        budget: {
          requestedPaise, approvedPaise, spentPaise: spend, committedPaise, pendingClaimsPaise: claimSum(['SUBMITTED']),
          remainingPaise: approvedPaise == null ? null : approvedPaise - spend - committedPaise,
          lines: event.budgetLines.map((b) => ({ id: b.id, category: b.category, amountPaise: Number(b.amountPaise), note: b.note })),
        },
        analytics: {
          timeline,
          demographics,
          conversionCount
        }
      };
    },

    // ---- door staff: temporary check-in access for one event
    async listDoorStaff(eventId) {
      const rows = await prisma.eventDoorStaff.findMany({
        where: { eventId },
        include: { user: { select: { id: true, name: true, studentId: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map((r) => ({ ...r.user, assignedAt: r.createdAt }));
    },

    async addDoorStaff(actorId, eventId, userId) {
      const [event, volunteer] = await Promise.all([
        prisma.event.findUnique({ where: { id: eventId }, select: { id: true, title: true, status: true } }),
        prisma.volunteer.findUnique({ where: { userId }, select: { userId: true } }),
      ]);
      if (!event) throw new AppError('NOT_FOUND', 404, 'Event was not found');
      if (event.status !== 'PUBLISHED') throw new AppError('INVALID_STATE_TRANSITION', 409, 'Door staff can only be assigned to published events');
      if (!volunteer) throw new AppError('VALIDATION_ERROR', 400, 'Only registered volunteers can be given door access');
      await prisma.eventDoorStaff.upsert({
        where: { eventId_userId: { eventId, userId } },
        create: { eventId, userId, assignedById: actorId },
        update: {},
      });
      await notify(prisma, { userId, type: 'DOOR_ASSIGNED', title: 'Door duty assigned', body: `You can check in guests for "${event.title}".`, link: `/door/${eventId}` });
      return this.listDoorStaff(eventId);
    },

    async myDoorDuties(userId) {
      const rows = await prisma.eventDoorStaff.findMany({
        where: { userId, event: { status: 'PUBLISHED', endAt: { gt: new Date(Date.now() - DOOR_WINDOW_MS) } } },
        include: { event: { select: { id: true, title: true, venue: true, startAt: true, endAt: true } } },
        orderBy: { event: { startAt: 'asc' } },
      });
      const now = Date.now();
      return rows.map(({ event: e }) => ({
        eventId: e.id, title: e.title, venue: e.venue, startAt: e.startAt, endAt: e.endAt,
        open: now >= e.startAt.getTime() - DOOR_WINDOW_MS && now <= e.endAt.getTime() + DOOR_WINDOW_MS,
      }));
    },

    async removeDoorStaff(eventId, userId) {
      await prisma.eventDoorStaff.deleteMany({ where: { eventId, userId } });
      return this.listDoorStaff(eventId);
    },

    async list(query = {}) {
      const page = parsePagination(query, { defaultLimit: 50 });
      const { visibility, status, q, category } = query;
      const where = {
        ...(visibility ? { visibility } : {}),
        ...(status ? { status } : { status: 'PUBLISHED' }),
        ...(category && category !== 'ALL' ? { category: { equals: category, mode: 'insensitive' } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { venue: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      };

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          orderBy: { startAt: 'asc' },
          skip: page.skip,
          take: page.take,
          include: {
            ticketTypes: true,
            proposedBy: { select: { id: true, name: true } },
          },
        }),
        prisma.event.count({ where }),
      ]);

      const data = events.map(({ approvedBudgetPaise, ...e }) => serialize(e));

      return { data, meta: createPageMeta(page, total) };
    },

    // Unpublished events (proposals) are visible only to their proposer and event leaders.
    async getById(id, viewer = null) {
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          ticketTypes: true,
          proposedBy: { select: { id: true, name: true } },
          budgetLines: true,
          reviews: { include: { reviewer: { select: { id: true, name: true } } } },
        },
      });
      if (!event) throw new AppError('NOT_FOUND', 404, 'Event was not found');
      const isLead = viewer && (event.proposedById === viewer.id || EVENT_LEADS.some((p) => viewer.permissions?.includes(p)));
      if (!['PUBLISHED', 'CLOSED'].includes(event.status) && !isLead) {
        throw new AppError('NOT_FOUND', 404, 'Event was not found');
      }
      const { budgetLines, reviews, approvedBudgetPaise, ...rest } = event;
      // Budget and mentor feedback are internal: only the proposer and event leaders see them.
      return serialize(isLead ? event : rest);
    },

    async reviewProposal(id, mentorId, { decision, comment, approvedBudget }) {
      const status = DECISION_STATUS[decision];
      if (!status) throw new AppError('VALIDATION_ERROR', 400, 'decision must be APPROVE, REQUEST_CHANGES or REJECT');
      const note = typeof comment === 'string' ? comment.trim() : '';
      if (decision !== 'APPROVE' && !note) throw new AppError('VALIDATION_ERROR', 400, 'Feedback is required for this decision');
      const budget = Number(approvedBudget);
      if (approvedBudget != null && (!Number.isFinite(budget) || budget < 0)) {
        throw new AppError('VALIDATION_ERROR', 400, 'approvedBudget must be a positive amount');
      }

      const updated = await prisma.$transaction(async (tx) => {
        const event = await tx.event.findUnique({ where: { id }, include: { ticketTypes: true, budgetLines: true } });
        if (!event) throw new AppError('NOT_FOUND', 404, 'Event was not found');
        if (!REVIEWABLE.includes(event.status)) {
          throw new AppError('INVALID_STATE_TRANSITION', 409, `This proposal is already ${event.status.toLowerCase().replaceAll('_', ' ')}`);
        }
        // Audit trail: what the mentor saw when deciding.
        await tx.eventReview.create({
          data: {
            eventId: id, reviewerId: mentorId, decision, comment: note || null,
            snapshot: { title: event.title, startAt: event.startAt, endAt: event.endAt, capacity: event.capacity, venue: event.venue,
              sponsorshipRequired: event.sponsorshipRequired,
              sponsorshipTargetPaise: event.sponsorshipTargetPaise != null ? Number(event.sponsorshipTargetPaise) : null,
              sponsorshipDeadline: event.sponsorshipDeadline,
              sponsorshipPitch: event.sponsorshipPitch,
              sponsorshipPackages: event.sponsorshipPackages,
              sponsorBenefits: event.sponsorBenefits,
              ticketTypes: event.ticketTypes.map((t) => ({ name: t.name, audience: t.audience, pricePaise: Number(t.pricePaise), quota: t.quota })),
              budgetLines: event.budgetLines?.map((b) => ({ category: b.category, amountPaise: Number(b.amountPaise) })),
            },
          },
        });
        const row = await tx.event.update({
          where: { id },
          data: {
            status,
            ...(decision === 'APPROVE' ? {
              approvedById: mentorId,
              approvedAt: new Date(),
              approvedBudgetPaise: approvedBudget != null ? BigInt(Math.round(budget * 100)) : undefined,
            } : {}),
          },
          include: { ticketTypes: true },
        });
        await notify(tx, {
          userId: event.proposedById,
          type: 'EVENT_REVIEWED',
          title: decision === 'APPROVE' ? 'Event approved and published' : decision === 'REJECT' ? 'Event proposal rejected' : 'Changes requested on your event',
          body: note ? `"${event.title}": ${note}` : `"${event.title}" is now live and tickets are on sale.`,
          link: decision === 'REQUEST_CHANGES' ? `/manage/events/${id}/edit` : `/manage/events/${id}/report`,
        });
        if (decision === 'APPROVE' && event.sponsorshipRequired) {
          const now = new Date();
          const sponsorshipLeads = await tx.roleAssignment.findMany({
            where: {
              role: 'SPONSORSHIP_HEAD',
              termStart: { lte: now },
              termEnd: { gt: now },
              endedAt: null,
            },
            select: { userId: true },
          });
          await notifyMany(tx, sponsorshipLeads.map((lead) => lead.userId), {
            type: 'SPONSORSHIP_REQUEST_READY',
            title: 'Approved event needs sponsorship',
            body: `"${event.title}" is ready for sponsor outreach.`,
            link: `/manage/sponsorship?event=${event.id}`,
          });
        }
        return row;
      });
      return serialize(updated);
    },
  };
}
