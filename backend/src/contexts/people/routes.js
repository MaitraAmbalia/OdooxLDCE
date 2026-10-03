import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticate, authorize } from '../../platform/auth/middleware.js';
import { validate } from '../../platform/http/validate.js';
import { rateLimit } from '../../platform/http/rateLimit.js';
import { AppError } from '../../platform/errors/AppError.js';
import { requireJson } from '../../middleware/requireJson.js';
import { profileSchema, changePasswordSchema, idParams, directorySchema, disabledSchema,
  assignmentSchema, endSchema, assignmentQuery, newsletterTokenSchema } from './auth/schemas.js';
import { clearSessionCookies, metadata } from './auth/routes.js';

export function createPeopleRoutes({ users, access, files, newsletter, config }) {
  const router = Router();
  const auth = authenticate({ config });
  router.get('/users/me', auth, async (req, res) => res.json({ data: await users.profile(req.user.sub) }));
  router.patch('/users/me', auth, requireJson, validate(profileSchema), async (req, res) => res.json({ data: await users.update(req.user.sub, req.validated.body, req.id) }));
  router.patch('/users/me/password', auth, requireJson, validate(changePasswordSchema), async (req, res) => {
    await users.changePassword(req.user.sub, req.validated.body, req.id); clearSessionCookies(res, config); return res.json({ data: { passwordChanged: true } });
  });
  router.get('/users', auth, authorize('member.read.any'), validate({ query: directorySchema }), async (req, res) => res.json(await users.directory(req.validated.query)));
  router.get('/users/:id', auth, authorize('member.read.any'), validate({ params: idParams, query: directorySchema }), async (req, res) => res.json({ data: await users.directory(req.validated.query, req.validated.params.id) }));
  // Mentor is the only term role with role.assign; this is the Phase 1 admin disable policy.
  router.patch('/users/:id/status', auth, authorize('role.assign'), requireJson, validate({ params: idParams, body: disabledSchema }), async (req, res) => {
    await users.disable(req.user.sub, req.validated.params.id, req.validated.body, req.id); return res.json({ data: { updated: true } });
  });
  router.get('/roles', auth, authorize('role.read'), (_req, res) => res.json({ data: access.roles() }));
  router.get('/role-assignments', auth, authorize('role.read'), validate({ query: assignmentQuery }), async (req, res) => res.json(await access.list(req.validated.query)));
  router.post('/role-assignments', auth, authorize('role.assign'), requireJson, validate(assignmentSchema), async (req, res) => res.status(201).json({ data: await access.assign(req.user.sub, req.validated.body, req.id) }));
  router.post('/role-assignments/:id/end', auth, authorize('role.assign'), requireJson, validate({ params: idParams, body: endSchema }), async (req, res) => {
    await access.end(req.user.sub, req.validated.params.id, req.validated.body.reason, req.id); return res.json({ data: { ended: true } });
  });
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1, fieldSize: 100 } }).single('file');
  router.post('/files', auth, rateLimit({ windowMs: 3600000, limit: 30, keyGenerator: (req) => req.user.sub }), (req, res, next) => {
    upload(req, res, (error) => next(error ? new AppError('INVALID_FILE', 400, 'Upload exceeds the allowed size or field limits') : undefined));
  }, validate(z.object({ purpose: z.enum(['AVATAR', 'APPLICATION_ATTACHMENT']) })), async (req, res) => {
    if (!req.file) throw new AppError('VALIDATION_ERROR', 400, 'File is required');
    return res.status(201).json({ data: await files.upload(req.user.sub, req.validated.body.purpose, req.file.buffer, req.id) });
  });
  router.get('/files/:id', authenticate({ config, optional: true }), validate({ params: idParams }), async (req, res) => {
    const file = await files.read(req.validated.params.id, req.user, req.id);
    res.set('Content-Type', file.mimeType).set('X-Content-Type-Options', 'nosniff').set('Cache-Control', file.purpose === 'AVATAR' ? 'public, max-age=300' : 'private, no-store');
    if (file.mimeType === 'application/pdf') res.set('Content-Disposition', `attachment; filename="${file.id}.pdf"`);
    return res.send(file.buffer);
  });
  router.delete('/files/:id', auth, validate({ params: idParams }), async (req, res) => { await files.remove(req.validated.params.id, req.user.sub, req.id); return res.json({ data: { deleted: true } }); });
  router.post('/newsletter/confirm', rateLimit({ limit: 20 }), requireJson, validate(newsletterTokenSchema), async (req, res) => { await newsletter.confirm(req.validated.body.token, metadata(req)); return res.json({ data: { confirmed: true } }); });
  router.post('/newsletter/unsubscribe', rateLimit({ limit: 20 }), requireJson, validate(newsletterTokenSchema), async (req, res) => { await newsletter.unsubscribe(req.validated.body.token, metadata(req)); return res.json({ data: { unsubscribed: true } }); });
  return router;
}
