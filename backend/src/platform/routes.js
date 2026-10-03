import { Router } from 'express';
import { z } from 'zod';
import { getClient, transaction } from './db/clients.js';
import { authenticate, authorize } from './auth/middleware.js';
import { accessClaimsSchema, ACCESS_TOKEN_TTL_SECONDS } from './auth/claims.js';
import { signAccessToken } from './auth/tokens.js';
import { validate } from './http/validate.js';
import { rateLimit } from './http/rateLimit.js';
import { requireJson } from '../middleware/requireJson.js';
import { audit } from './audit/index.js';
import { generalSettings, policySettings, defaults, settingsBody } from './settings/definitions.js';
import { AppError } from './errors/AppError.js';

const page = z.object({ page: z.coerce.number().int().min(1).max(1000000).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
const auditQuery = page.extend({ actorId: z.uuid().optional(), action: z.string().max(80).optional(), entityType: z.string().max(80).optional(), entityId: z.uuid().optional(), from: z.iso.datetime({ offset: true }).optional(), to: z.iso.datetime({ offset: true }).optional() });
export function createPlatformRouter({ config, client = () => getClient('platform', config) }) {
  const router = Router();
  const auth = authenticate({ config });
  const readSettings = async () => ({ ...defaults, ...Object.fromEntries((await (await client()).setting.findMany()).map((row) => [row.key, row.value])) });
  router.get('/settings/public', async (_req, res) => {
    const settings = await readSettings();
    return res.json({ data: Object.fromEntries(['club.name', 'club.academicYearEnd', 'merch.nonMemberPurchase'].map((key) => [key, settings[key]])) });
  });
  router.get('/settings', auth, authorize('settings.manage', 'settings.policy.manage'), async (_req, res) => res.json({ data: await readSettings() }));
  for (const [path, permission, shape] of [['/settings', 'settings.manage', generalSettings], ['/settings/policy', 'settings.policy.manage', policySettings]]) {
    router.patch(path, auth, authorize(permission), requireJson, validate(settingsBody(shape)), async (req, res) => {
      const values = req.validated.body.values;
      await transaction(await client(), async (tx) => {
        for (const [key, value] of Object.entries(values)) {
          await tx.setting.upsert({ where: { key }, create: { key, value, updatedBy: req.user.sub }, update: { value, updatedBy: req.user.sub } });
        }
        await audit(tx, { actorId: req.user.sub, action: 'settings.changed', entityType: 'settings', details: { keys: Object.keys(values) }, requestId: req.id });
      });
      return res.json({ data: values });
    });
  }
  router.get('/audit-logs', auth, authorize('audit.read'), validate({ query: auditQuery }), async (req, res) => {
    const { page, limit, from, to, ...filters } = req.validated.query;
    const where = { ...filters, ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}) };
    const db = await client();
    const [data, total] = await Promise.all([db.auditLog.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * limit, take: limit }), db.auditLog.count({ where })]);
    return res.json({ data, meta: { page, limit, total } });
  });
  if (!config.isProduction) {
    router.post('/dev/token', rateLimit({ limit: 30 }), requireJson, validate(z.object(accessClaimsSchema.shape).omit({ iat: true, exp: true })), async (req, res) => {
      if (req.get('Origin') && req.get('Origin') !== config.corsOrigin) throw new AppError('FORBIDDEN', 403, 'Origin is not allowed');
      const iat = Math.floor(Date.now() / 1000);
      const claims = { ...req.validated.body, iat, exp: iat + ACCESS_TOKEN_TTL_SECONDS };
      const token = await signAccessToken(claims, config.accessSecret);
      res.cookie('access_token', token, { httpOnly: true, secure: config.isProduction, sameSite: 'strict', path: '/api/v1', maxAge: 900000 });
      return res.json({ data: { token, claims } });
    });
  }
  return router;
}
