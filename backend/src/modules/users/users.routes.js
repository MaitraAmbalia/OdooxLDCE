import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { profileSchema, changePasswordSchema, idParams } from '../auth/auth.schemas.js';

const directoryQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
});

const disableBody = z.object({
  isDisabled: z.boolean(),
  reason: z.string().min(1).max(500).optional(),
});

export function createUsersRouter({ service, authenticate, authorize }) {
  const router = Router();

  // GET /users/me - Current user profile
  router.get('/users/me', authenticate, async (req, res) => {
    res.json({ data: await service.profile(req.user.sub) });
  });

  // PATCH /users/me - Update profile
  router.patch('/users/me', authenticate, validate({ body: profileSchema }), async (req, res) => {
    res.json({ data: await service.update(req.user.sub, req.body) });
  });

  // PATCH /users/me/password - Change password
  router.patch('/users/me/password', authenticate, validate({ body: changePasswordSchema }), async (req, res) => {
    await service.changePassword(req.user.sub, req.body);
    res.json({ data: { passwordChanged: true } });
  });

  // GET /users - Directory search (Members/Leadership)
  router.get('/users', authenticate, authorize('member.read.any'), validate({ query: directoryQuery }), async (req, res) => {
    res.json(await service.directory(req.query));
  });

  // PATCH /users/:id/status - Disable/Enable user account (Admin)
  router.patch('/users/:id/status', authenticate, authorize('role.assign'), validate({ params: idParams, body: disableBody }), async (req, res) => {
    res.json({ data: await service.disable(req.user.sub, req.params.id, req.body) });
  });

  return router;
}
