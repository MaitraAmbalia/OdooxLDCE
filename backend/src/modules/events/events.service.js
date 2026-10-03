import { AppError } from '../../lib/AppError.js';
import { parsePagination, createPageMeta } from '../../lib/pagination.js';
import { notify, notifyMany } from '../../lib/notify.js';

export const EVENT_LEADS = ['event.approve', 'event.propose', 'event.publish'];
const REVIEWABLE = ['PENDING_APPROVAL', 'CHANGES_REQUESTED'];
const DECISION_STATUS = { APPROVE: 'PUBLISHED', REQUEST_CHANGES: 'CHANGES_REQUESTED', REJECT: 'REJECTED' };

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
  return {
    // Proposals wait for Mentor authorization; tickets only go on sale once PUBLISHED.
    async create(userId, input) {
      const event = await prisma.event.create({
        data: {
          title: input.title,
          description: input.description,
          category: input.category ?? 'GENERAL',
          venue: input.venue,
          startAt: new Date(input.startAt),
          endAt: new Date(input.endAt),
          capacity: input.capacity,
          visibility: input.visibility ?? 'PUBLIC',
          status: 'PENDING_APPROVAL',
          proposedById: userId,
          ...sponsorshipData(input),
          ticketTypes: input.ticketTypes
            ? {
                create: input.ticketTypes.map((t) => ({
                  name: t.name,
                  audience: t.audience ?? 'ALL',
                  pricePaise: BigInt(t.pricePaise ?? 0),
                  quota: t.quota ?? input.capacity,
                  maxPerUser: t.maxPerUser ?? 5,
                  salesStartAt: new Date(t.salesStartAt ?? input.startAt),
                  salesEndAt: new Date(t.salesEndAt ?? input.endAt),
                })),
              }
            : undefined,
        },
        include: {
          ticketTypes: true,
        },
      });
      const mentors = await prisma.roleAssignment.findMany({ where: { role: 'MENTOR', endedAt: null }, select: { userId: true } });
      await notifyMany(prisma, mentors.map((m) => m.userId), {
        type: 'EVENT_PROPOSAL',
        title: 'Event proposal to review',
        body: `"${event.title}" is waiting for your authorization.`,
        link: `/manage/events/${event.id}/review`,
      });
      return withPublicAmounts({ ...event, ticketTypes: event.ticketTypes.map((t) => ({ ...t, pricePaise: Number(t.pricePaise) })) });
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

      const data = events.map((e) => ({
        ...e,
        approvedBudgetPaise: e.approvedBudgetPaise != null ? Number(e.approvedBudgetPaise) : null,
        sponsorshipTargetPaise: e.sponsorshipTargetPaise != null ? Number(e.sponsorshipTargetPaise) : null,
        startDate: e.startAt,
        endDate: e.endAt,
        coverImageUrl: e.coverFileId ? `/api/v1/files/${e.coverFileId}` : null,
        ticketTypes: e.ticketTypes.map((t) => ({
          ...t,
          pricePaise: Number(t.pricePaise),
        })),
      }));

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
      const canSeeUnpublished = viewer && (event.proposedById === viewer.id || EVENT_LEADS.some((p) => viewer.permissions?.includes(p)));
      if (!['PUBLISHED', 'CLOSED'].includes(event.status) && !canSeeUnpublished) {
        throw new AppError('NOT_FOUND', 404, 'Event was not found');
      }
      return {
        ...event,
        approvedBudgetPaise: event.approvedBudgetPaise != null ? Number(event.approvedBudgetPaise) : null,
        sponsorshipTargetPaise: event.sponsorshipTargetPaise != null ? Number(event.sponsorshipTargetPaise) : null,
        startDate: event.startAt,
        endDate: event.endAt,
        coverImageUrl: event.coverFileId ? `/api/v1/files/${event.coverFileId}` : null,
        budgetLines: event.budgetLines?.map((bl) => ({
          ...bl,
          amountPaise: Number(bl.amountPaise),
        })),
        ticketTypes: event.ticketTypes.map((t) => ({
          ...t,
          pricePaise: Number(t.pricePaise),
        })),
      };
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
        const event = await tx.event.findUnique({ where: { id }, include: { ticketTypes: true } });
        if (!event) throw new AppError('NOT_FOUND', 404, 'Event was not found');
        if (!REVIEWABLE.includes(event.status)) {
          throw new AppError('INVALID_STATE_TRANSITION', 409, `This proposal is already ${event.status.toLowerCase().replaceAll('_', ' ')}`);
        }
        // Audit trail: what the mentor saw when deciding.
        await tx.eventReview.create({
          data: {
            eventId: id, reviewerId: mentorId, decision, comment: note || null,
            snapshot: { title: event.title, startAt: event.startAt, endAt: event.endAt, capacity: event.capacity, venue: event.venue,
              sponsorshipRequired: event.sponsorshipRequired, sponsorshipTargetPaise: event.sponsorshipTargetPaise != null ? Number(event.sponsorshipTargetPaise) : null,
              sponsorshipDeadline: event.sponsorshipDeadline, sponsorshipPitch: event.sponsorshipPitch,
              sponsorshipPackages: event.sponsorshipPackages, sponsorBenefits: event.sponsorBenefits,
              ticketTypes: event.ticketTypes.map((t) => ({ name: t.name, pricePaise: Number(t.pricePaise), quota: t.quota })) },
          },
        });
        const row = await tx.event.update({
          where: { id },
          data: {
            status,
            ...(decision === 'APPROVE' ? {
              approvedById: mentorId,
              approvedAt: new Date(),
              approvedBudgetPaise: approvedBudget ? BigInt(Math.round(budget * 100)) : undefined,
            } : {}),
          },
          include: { ticketTypes: true },
        });
        await notify(tx, {
          userId: event.proposedById,
          type: 'EVENT_REVIEWED',
          title: decision === 'APPROVE' ? 'Event approved and published' : decision === 'REJECT' ? 'Event proposal rejected' : 'Changes requested on your event',
          body: note ? `"${event.title}": ${note}` : `"${event.title}" is now live and tickets are on sale.`,
          link: `/events/${id}`,
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
      return {
        ...updated,
        ticketTypes: updated.ticketTypes.map((t) => ({ ...t, pricePaise: Number(t.pricePaise) })),
        approvedBudgetPaise: updated.approvedBudgetPaise != null ? Number(updated.approvedBudgetPaise) : null,
        sponsorshipTargetPaise: updated.sponsorshipTargetPaise != null ? Number(updated.sponsorshipTargetPaise) : null,
        startDate: updated.startAt,
        endDate: updated.endAt,
      };
    },
  };
}
