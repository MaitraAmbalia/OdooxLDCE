import { transaction, lock } from '../../../platform/db/clients.js';
import { AppError } from '../../../platform/errors/AppError.js';
import { audit } from '../../../platform/audit/index.js';
import { publish } from '../../../platform/events/bus.js';
import { profileSelect, revokeSessions } from '../auth/repository.js';
import { hashPassword, verifyPassword } from '../auth/passwords.js';

const missing = () => new AppError('NOT_FOUND', 404, 'User was not found');
export function createUsersService({ client }) {
  return {
    async profile(userId) {
      const user = await (await client()).user.findUnique({ where: { id: userId }, select: profileSelect });
      if (!user || user.isDisabled) throw missing();
      return user;
    },
    async update(userId, input, requestId) {
      return transaction(await client(), async (tx) => {
        await lock(tx, `user:${userId}`);
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || user.isDisabled) throw missing();
        if (input.avatarFileId) {
          const file = await tx.peopleFile.findUnique({ where: { id: input.avatarFileId } });
          if (!file || file.ownerId !== userId || file.purpose !== 'AVATAR') throw new AppError('NOT_FOUND', 404, 'Avatar was not found');
          await tx.peopleFile.update({ where: { id: file.id }, data: { attachedAt: new Date() } });
        }
        const updated = await tx.user.update({ where: { id: userId }, data: input, select: profileSelect });
        if ('avatarFileId' in input && user.avatarFileId && user.avatarFileId !== input.avatarFileId) {
          await tx.peopleFile.update({ where: { id: user.avatarFileId }, data: { attachedAt: null } });
        }
        await audit(tx, { actorId: userId, action: 'user.profile.changed', entityType: 'user', entityId: userId, details: { fields: Object.keys(input) }, requestId });
        return updated;
      });
    },
    async changePassword(userId, input, requestId) {
      const passwordHash = await hashPassword(input.newPassword);
      return transaction(await client(), async (tx) => {
        await lock(tx, `user:${userId}`);
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || user.isDisabled) throw missing();
        if (!await verifyPassword(user.passwordHash, input.currentPassword)) throw new AppError('INVALID_CREDENTIALS', 401, 'Current password is incorrect');
        await tx.user.update({ where: { id: userId }, data: { passwordHash } });
        await revokeSessions(tx, userId, 'PASSWORD_RESET');
        await tx.emailToken.updateMany({ where: { userId, purpose: 'RESET_PASSWORD', usedAt: null }, data: { usedAt: new Date() } });
        await audit(tx, { actorId: userId, action: 'user.password.changed', entityType: 'user', entityId: userId, requestId });
      });
    },
    async directory(query, id) {
      const db = await client();
      const { page, limit, q = '', role = null, membershipStatus = null, isVolunteer = null } = query;
      const rows = await db.$queryRaw`SELECT u.id, u.name, u.student_id AS "studentId",
        COALESCE(m.status, 'NONE') AS "membershipStatus", m.expires_at AS "expiresAt",
        COALESCE(r.roles, ARRAY[]::text[]) AS roles, count(*) OVER()::int AS total
        FROM people.users u
        LEFT JOIN commerce.v_member_status m ON m.user_id = u.id
        LEFT JOIN LATERAL (SELECT array_agg(DISTINCT role::text) AS roles FROM people.role_assignments
          WHERE user_id = u.id AND term_start <= now() AND term_end > now() AND (ended_at IS NULL OR ended_at > now())) r ON true
        LEFT JOIN people.volunteers v ON v.user_id = u.id AND v.status = 'ACTIVE'
        WHERE NOT u.is_disabled AND (${id ?? null}::uuid IS NULL OR u.id = ${id ?? null}::uuid)
          AND (u.name ILIKE ${`%${q}%`} OR u.student_id ILIKE ${`%${q}%`})
          AND (${role}::text IS NULL OR ${role}::text = ANY(r.roles))
          AND (${membershipStatus}::text IS NULL OR COALESCE(m.status, 'NONE') = ${membershipStatus})
          AND (${isVolunteer}::boolean IS NULL OR (v.user_id IS NOT NULL) = ${isVolunteer})
        ORDER BY u.name, u.id LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
      if (id && !rows.length) throw missing();
      const data = rows.map(({ total: _total, ...user }) => user);
      return id ? data[0] : { data, meta: { page, limit, total: rows[0]?.total ?? 0 } };
    },
    async disable(actorId, userId, input, requestId) {
      if (actorId === userId) throw new AppError('SELF_APPROVAL', 403, 'You cannot disable your own account');
      return transaction(await client(), async (tx) => {
        await lock(tx, `user:${userId}`);
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw missing();
        if (user.isDisabled === input.isDisabled) return;
        await tx.user.update({ where: { id: userId }, data: { isDisabled: input.isDisabled } });
        if (input.isDisabled) {
          await revokeSessions(tx, userId);
          await publish(tx, 'people.user.disabled', { userId }, { actorId });
        }
        await audit(tx, { actorId, action: input.isDisabled ? 'user.disabled' : 'user.enabled', entityType: 'user', entityId: userId, details: { reason: input.reason }, requestId });
      });
    },
  };
}
