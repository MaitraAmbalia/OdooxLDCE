import { AppError } from '../../lib/AppError.js';
import { parsePagination, createPageMeta } from '../../lib/pagination.js';

export function createEventsService({ prisma }) {
  return {
    async create(userId, input) {
      return prisma.event.create({
        data: {
          title: input.title,
          description: input.description,
          category: input.category ?? 'GENERAL',
          venue: input.venue,
          startAt: new Date(input.startAt),
          endAt: new Date(input.endAt),
          capacity: input.capacity,
          visibility: input.visibility ?? 'PUBLIC',
          status: 'PUBLISHED',
          proposedById: userId,
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

    async getById(id) {
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
      return {
        ...event,
        approvedBudgetPaise: event.approvedBudgetPaise != null ? Number(event.approvedBudgetPaise) : null,
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
      const status = decision === 'APPROVE' ? 'APPROVED' : decision === 'REQUEST_CHANGES' ? 'CHANGES_REQUESTED' : 'REJECTED';
      const updated = await prisma.event.update({
        where: { id },
        data: {
          status: status === 'APPROVED' ? 'PUBLISHED' : status,
          approvedById: mentorId,
          approvedAt: new Date(),
          approvedBudgetPaise: approvedBudget ? BigInt(approvedBudget * 100) : undefined,
        },
        include: { ticketTypes: true },
      });
      return {
        ...updated,
        approvedBudgetPaise: updated.approvedBudgetPaise != null ? Number(updated.approvedBudgetPaise) : null,
        startDate: updated.startAt,
        endDate: updated.endAt,
      };
    },
  };
}
