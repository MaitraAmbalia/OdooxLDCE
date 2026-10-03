import { AppError } from '../../lib/AppError.js';

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

    async listUserNotifications(userId) {
      return prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
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
