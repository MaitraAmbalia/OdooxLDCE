import { Router } from 'express';

export function createHealthRouter({ prisma }) {
  const router = Router();

  router.get('/health', async (_req, res) => {
    let databaseStatus = 'up';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseStatus = 'down';
    }

    const healthy = databaseStatus === 'up';
    return res.status(healthy ? 200 : 503).json({
      data: {
        status: healthy ? 'ok' : 'degraded',
        db: databaseStatus,
        uptime: Math.floor(process.uptime()),
      },
    });
  });

  return router;
}
