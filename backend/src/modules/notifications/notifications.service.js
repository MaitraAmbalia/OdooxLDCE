import { AppError } from '../../lib/AppError.js';
import { parsePagination, createPageMeta } from '../../lib/pagination.js';

export function createNotificationsService({ prisma }) {
  return {
    async notify({ userId, title, body, type = 'GENERAL', link = null }) {
      return prisma.notification.create({
        data: {
          userId,
          title,
          body,
          type,
          link,
          isRead: false,
        },
      });
    },

    async listUserNotifications(userId, query = {}) {
      const page = parsePagination(query, { defaultLimit: 20 });
      const where = { userId };

      const [data, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: page.skip,
          take: page.take,
        }),
        prisma.notification.count({ where }),
      ]);

      return { data, meta: createPageMeta(page, total) };
    },

    async markRead(userId, notificationId) {
      const item = await prisma.notification.findUnique({ where: { id: notificationId } });
      if (!item || item.userId !== userId) throw new AppError('NOT_FOUND', 404, 'Notification not found');
      return prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
      });
    },

    async markAllRead(userId) {
      return prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    },
  };
}
