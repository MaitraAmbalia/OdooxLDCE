import { AppError } from '../../lib/AppError.js';
import { rolePermissions } from './access.permissions.js';

export function createAccessService({ prisma }) {
  return {
    roles: () => Object.entries(rolePermissions).map(([role, permissions]) => ({ role, permissions })),

    async list(query = {}) {
      const { page = 1, limit = 20, active, role, userId } = query;
      const now = new Date();
      const where = {
        ...(role ? { role } : {}),
        ...(userId ? { userId } : {}),
        ...(active
          ? {
              termStart: { lte: now },
              termEnd: { gt: now },
              OR: [{ endedAt: null }, { endedAt: { gt: now } }],
            }
          : {}),
      };

      const [data, total] = await Promise.all([
        prisma.roleAssignment.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ termStart: 'desc' }, { id: 'desc' }],
        }),
        prisma.roleAssignment.count({ where }),
      ]);

      return { data, meta: { page, limit, total } };
    },

    async assign(actorId, input) {
      if (input.role === 'MENTOR') {
        throw new AppError('FORBIDDEN', 403, 'Mentor cannot be assigned in the application');
      }
      if (actorId === input.userId) {
        throw new AppError('SELF_APPROVAL', 403, 'You cannot assign yourself');
      }
      if (new Date(input.termEnd) <= new Date()) {
        throw new AppError('VALIDATION_ERROR', 400, 'Term must end in the future');
      }

      return prisma.$transaction(async (tx) => {
        const target = await tx.user.findUnique({ where: { id: input.userId } });
        if (!target || target.isDisabled || !target.emailVerifiedAt) {
          throw new AppError('NOT_FOUND', 404, 'Eligible user was not found');
        }

        // Check active membership
        const activeMembership = await tx.membership.findFirst({
          where: { userId: input.userId, status: 'ACTIVE' },
        });
        if (!activeMembership && process.env.NODE_ENV === 'production') {
          throw new AppError('MEMBERSHIP_LAPSED', 409, 'Target must be an active member');
        }

        // End current role holders for this role
        const holders = await tx.roleAssignment.findMany({
          where: {
            role: input.role,
            endedAt: null,
            termEnd: { gt: new Date(input.termStart) },
          },
        });

        for (const holder of holders) {
          await tx.roleAssignment.update({
            where: { id: holder.id },
            data: { endedAt: new Date(input.termStart) },
          });
        }

        return tx.roleAssignment.create({
          data: {
            ...input,
            termStart: new Date(input.termStart),
            termEnd: new Date(input.termEnd),
            source: 'MANUAL',
            createdById: actorId,
          },
        });
      });
    },

    async end(actorId, id, reason) {
      return prisma.$transaction(async (tx) => {
        const existing = await tx.roleAssignment.findUnique({ where: { id } });
        if (!existing) throw new AppError('NOT_FOUND', 404, 'Role assignment was not found');
        if (existing.role === 'MENTOR') {
          throw new AppError('FORBIDDEN', 403, 'Mentor can only be changed through system administration');
        }
        if (existing.userId === actorId) {
          throw new AppError('SELF_APPROVAL', 403, 'You cannot change your own assignment');
        }

        const ended = await tx.roleAssignment.updateMany({
          where: { id, endedAt: null },
          data: { endedAt: new Date() },
        });

        if (!ended.count) throw new AppError('INVALID_STATE_TRANSITION', 409, 'Role has already ended');
        return { ended: true };
      });
    },
  };
}
