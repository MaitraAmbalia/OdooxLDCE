import { Router } from 'express';

export function createVolunteersRouter({ service, authenticate, authorize }) {
  const router = Router();

  router.post('/volunteers/register', authenticate, async (req, res) => {
    res.status(201).json({ data: await service.register(req.user.sub, req.body) });
  });

  router.get('/volunteers', authenticate, authorize('volunteer.manage', 'project.manage'), async (req, res) => {
    res.json(await service.list(req.query));
  });

  router.patch('/volunteers/me', authenticate, async (req, res) => {
    res.json({ data: await service.update(req.user.sub, req.body) });
  });

  return router;
}
