import { Router } from 'express';

export function createDashboardsRouter({ service, authenticate }) {
  const router = Router();

  router.get('/dashboard/commerce/:role', authenticate, async (req, res) => {
    const data = await service.getDashboard(req.user.sub, req.params.role, req.user.permissions);
    res.json({ data });
  });

  return router;
}
