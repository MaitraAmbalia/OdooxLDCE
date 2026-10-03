import { Router } from 'express';

export function createNotificationsRouter({ service, authenticate }) {
  const router = Router();

  router.get('/notifications', authenticate, async (req, res) => {
    res.json({ data: await service.listUserNotifications(req.user.sub) });
  });

  router.patch('/notifications/:id/read', authenticate, async (req, res) => {
    res.json({ data: await service.markRead(req.user.sub, req.params.id) });
  });

  router.post('/notifications/read-all', authenticate, async (req, res) => {
    res.json({ data: await service.markAllRead(req.user.sub) });
  });

  return router;
}
