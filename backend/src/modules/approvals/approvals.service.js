import { AppError } from '../../lib/AppError.js';
import { parsePagination, createPageMeta } from '../../lib/pagination.js';

const applyHandlers = new Map();

export const registerApprovalHandler = (type, onApprove) => applyHandlers.set(type, onApprove);

export function createApprovalsService({ prisma }) {
  return {
    async requestApproval(userId, { type, targetId, proposedValue, currentValue }) {
      return prisma.approval.create({
        data: {
          type,
          targetId,
          proposedValue,
          currentValue,
          requestedById: userId,
        },
      });
    },

    async listPending(type, query = {}) {
      const page = parsePagination(query, { defaultLimit: 50 });
      const where = { status: 'PENDING' };
      if (type) where.type = type;
      const [data, total] = await Promise.all([
        prisma.approval.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: page.skip,
          take: page.take,
        }),
        prisma.approval.count({ where }),
      ]);
      return { data, meta: createPageMeta(page, total) };
    },

    async decide(userId, approvalId, { decision, comment }) {
      if (!['APPROVED', 'REJECTED'].includes(decision)) {
        throw new AppError('VALIDATION_ERROR', 400, 'Invalid decision');
      }

      return prisma.$transaction(async (tx) => {
        const approval = await tx.approval.findUnique({ where: { id: approvalId } });
        if (!approval) throw new AppError('NOT_FOUND', 404, 'Approval not found');
        if (approval.status !== 'PENDING') throw new AppError('CONFLICT', 409, 'Approval already decided');
        if (approval.requestedById === userId) {
          throw new AppError('FORBIDDEN', 403, 'Cannot decide your own approval request');
        }

        const updated = await tx.approval.update({
          where: { id: approvalId },
          data: {
            status: decision,
            decidedById: userId,
            decidedAt: new Date(),
            comment,
          },
        });

        if (decision === 'APPROVED') {
          const handler = applyHandlers.get(approval.type);
          if (handler) {
            await handler(updated, tx);
          }
        }

        return updated;
      });
    },
  };
}
