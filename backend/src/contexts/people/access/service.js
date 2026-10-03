import { transaction, lock } from '../../../platform/db/clients.js';
import { AppError } from '../../../platform/errors/AppError.js';
import { audit } from '../../../platform/audit/index.js';
import { publish } from '../../../platform/events/bus.js';
import { revokeSessions } from '../auth/repository.js';
import { rolePermissions } from './permissions.js';

export function createAccessService({ client }) {
  return {
    roles: () => Object.entries(rolePermissions).map(([role, permissions]) => ({ role, permissions })),
    async list(query) {
      const { page, limit, active, role, userId } = query;
      const now = new Date();
      const where = { role, userId, ...(active ? { termStart: { lte: now }, termEnd: { gt: now }, OR: [{ endedAt: null }, { endedAt: { gt: now } }] } : {}) };
      const db = await client();
      const [data, total] = await Promise.all([db.roleAssignment.findMany({ where, skip: (page - 1) * limit, take: limit,
        orderBy: [{ termStart: 'desc' }, { id: 'desc' }] }), db.roleAssignment.count({ where })]);
      return { data, meta: { page, limit, total } };
    },
    async assign(actorId, input, requestId) {
      if (input.role === 'MENTOR') throw new AppError('FORBIDDEN', 403, 'Mentor cannot be assigned in the application');
      if (actorId === input.userId) throw new AppError('SELF_APPROVAL', 403, 'You cannot assign yourself');
      if (new Date(input.termEnd) <= new Date()) throw new AppError('VALIDATION_ERROR', 400, 'Term must end in the future');
      return transaction(await client(), async (tx) => {
        // Serialize overrides per role; the database exclusion constraint is the backstop.
        await lock(tx, `role:${input.role}`);
        await lock(tx, `user:${input.userId}`);
        const target = await tx.user.findUnique({ where: { id: input.userId } });
        if (!target || target.isDisabled || !target.emailVerifiedAt) throw new AppError('NOT_FOUND', 404, 'Eligible user was not found');
        const members = await tx.$queryRaw`SELECT user_id FROM commerce.v_active_members WHERE user_id = ${input.userId}::uuid`;
        if (!members.length) throw new AppError('MEMBERSHIP_LAPSED', 409, 'Target must be an active member');
        const holders = await tx.roleAssignment.findMany({ where: { role: input.role, endedAt: null, termEnd: { gt: new Date(input.termStart) } } });
        for (const holder of holders) {
          await tx.roleAssignment.update({ where: { id: holder.id }, data: { endedAt: new Date(input.termStart) } });
          await revokeSessions(tx, holder.userId);
          await publish(tx, 'people.role.ended', { userId: holder.userId }, { actorId });
          await audit(tx, { actorId, action: 'role.ended', entityType: 'role_assignment', entityId: holder.id, details: { reason: input.reason }, requestId });
        }
        const assignment = await tx.roleAssignment.create({ data: { ...input,
          termStart: new Date(input.termStart), termEnd: new Date(input.termEnd), source: 'MANUAL', createdById: actorId } });
        await revokeSessions(tx, input.userId);
        await audit(tx, { actorId, action: 'role.assigned', entityType: 'role_assignment', entityId: assignment.id, details: { userId: input.userId, role: input.role, reason: input.reason }, requestId });
        return assignment;
      });
    },
    async end(actorId, id, reason, requestId) {
      return transaction(await client(), async (tx) => {
        const existing = await tx.roleAssignment.findUnique({ where: { id } });
        if (!existing) throw new AppError('NOT_FOUND', 404, 'Role assignment was not found');
        if (existing.role === 'MENTOR') throw new AppError('FORBIDDEN', 403, 'Mentor can only be changed through system administration');
        if (existing.userId === actorId) throw new AppError('SELF_APPROVAL', 403, 'You cannot change your own assignment');
        await lock(tx, `role:${existing.role}`);
        const ended = await tx.roleAssignment.updateMany({ where: { id, endedAt: null }, data: { endedAt: new Date() } });
        if (!ended.count) throw new AppError('INVALID_STATE_TRANSITION', 409, 'Role has already ended');
        await revokeSessions(tx, existing.userId);
        await publish(tx, 'people.role.ended', { userId: existing.userId }, { actorId });
        await audit(tx, { actorId, action: 'role.ended', entityType: 'role_assignment', entityId: id, details: { reason }, requestId });
      });
    },
  };
}
