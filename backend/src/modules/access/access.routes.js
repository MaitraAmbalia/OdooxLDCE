import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { requireJson } from '../../middleware/requireJson.js';

const idParams = z.object({ id: z.string().uuid() });
const assignmentQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  active: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  role: z.string().optional(),
  userId: z.string().uuid().optional(),
});

const assignmentBody = z.object({
  userId: z.string().uuid(),
  role: z.enum(['MENTOR', 'PRESIDENT', 'TREASURER', 'EVENT_HEAD', 'VOLUNTEER_HEAD', 'MARKETING_HEAD']),
  termStart: z.string().datetime({ offset: true }),
  termEnd: z.string().datetime({ offset: true }),
  reason: z.string().min(1).max(500),
});

const endBody = z.object({
  reason: z.string().min(1).max(500),
});

export function createAccessRouter({ service, authenticate, authorize }) {
  const router = Router();

  router.get('/roles', authenticate, authorize('role.read'), (_req, res) => {
    res.json({ data: service.roles() });
  });

  router.get('/role-assignments', authenticate, authorize('role.read'), validate({ query: assignmentQuery }), async (req, res) => {
    res.json(await service.list(req.validated.query));
  });

  router.post('/role-assignments', authenticate, authorize('role.assign'), requireJson, validate({ body: assignmentBody }), async (req, res) => {
    res.status(201).json({ data: await service.assign(req.user.sub, req.validated.body) });
  });

  router.post('/role-assignments/:id/end', authenticate, authorize('role.assign'), requireJson, validate({ params: idParams, body: endBody }), async (req, res) => {
    res.json({ data: await service.end(req.user.sub, req.params.id, req.validated.body.reason) });
  });

  return router;
}
