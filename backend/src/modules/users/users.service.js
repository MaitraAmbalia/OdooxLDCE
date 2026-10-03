import { AppError } from '../../lib/AppError.js';
import { hashPassword, verifyPassword } from '../../utils/security.js';

const missing = () => new AppError('NOT_FOUND', 404, 'User was not found');

export function createUsersService({ prisma }) {
  return {
    async profile(userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
          phone: true,
          avatarFileId: true,
          emailVerifiedAt: true,
          isDisabled: true,
          createdAt: true,
        },
      });
      if (!user || user.isDisabled) throw missing();
      return user;
    },

    async update(userId, input) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.isDisabled) throw missing();

      return prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.avatarFileId !== undefined ? { avatarFileId: input.avatarFileId } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
          phone: true,
          avatarFileId: true,
          emailVerifiedAt: true,
        },
      });
    },

    async changePassword(userId, input) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.isDisabled) throw missing();

      if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
        throw new AppError('INVALID_CREDENTIALS', 401, 'Current password is incorrect');
      }

      const passwordHash = await hashPassword(input.newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });
    },

    async directory(query = {}) {
      const { page = 1, limit = 20, q = '' } = query;
      const where = {
        isDisabled: false,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { studentId: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true,
            createdAt: true,
            volunteer: { select: { status: true } },
            roleAssignments: {
              where: {
                termEnd: { gt: new Date() },
                endedAt: null,
              },
              select: { role: true },
            },
            memberships: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { status: true, expiresAt: true },
            },
          },
          orderBy: { name: 'asc' },
        }),
        prisma.user.count({ where }),
      ]);

      const formatted = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        studentId: u.studentId,
        isVolunteer: u.volunteer?.status === 'ACTIVE',
        roles: u.roleAssignments.map((r) => r.role),
        membershipStatus: u.memberships[0]?.status ?? 'NONE',
        expiresAt: u.memberships[0]?.expiresAt ?? null,
      }));

      return { data: formatted, meta: { page, limit, total } };
    },

    async disable(actorId, userId, input) {
      if (actorId === userId) {
        throw new AppError('SELF_APPROVAL', 403, 'You cannot disable your own account');
      }
      return prisma.user.update({
        where: { id: userId },
        data: { isDisabled: input.isDisabled },
      });
    },
  };
}
