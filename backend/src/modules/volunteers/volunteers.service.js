import { AppError } from '../../lib/AppError.js';
import { parsePagination, createPageMeta } from '../../lib/pagination.js';

export function createVolunteersService({ prisma }) {
  return {
    async register(userId, data = {}) {
      const existing = await prisma.volunteer.findUnique({ where: { userId } });
      if (existing) {
        return prisma.volunteer.update({
          where: { userId },
          data: { status: 'ACTIVE', skills: data.skills ?? existing.skills },
        });
      }
      return prisma.volunteer.create({
        data: {
          userId,
          status: 'ACTIVE',
          skills: data.skills ?? [],
        },
      });
    },

    async update(userId, data) {
      const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
      if (!volunteer) throw new AppError('NOT_FOUND', 404, 'Volunteer profile not found');
      return prisma.volunteer.update({
        where: { userId },
        data: {
          ...(data.status ? { status: data.status } : {}),
          ...(data.skills ? { skills: data.skills } : {}),
        },
      });
    },

    async list(query = {}) {
      const page = parsePagination(query, { defaultLimit: 50 });
      const [data, total] = await Promise.all([
        prisma.volunteer.findMany({
          skip: page.skip,
          take: page.take,
          include: {
            user: {
              select: { id: true, name: true, email: true, studentId: true, phone: true },
            },
          },
        }),
        prisma.volunteer.count(),
      ]);

      return { data, meta: createPageMeta(page, total) };
    },
  };
}
