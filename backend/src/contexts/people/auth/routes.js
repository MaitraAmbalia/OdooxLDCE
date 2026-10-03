import { Router } from 'express';
import { authenticate } from '../../../platform/auth/middleware.js';
import { validate } from '../../../platform/http/validate.js';
import { rateLimit } from '../../../platform/http/rateLimit.js';
import { requireJson } from '../../../middleware/requireJson.js';
import { registerSchema, verifySchema, loginSchema, emailSchema, resetSchema } from './schemas.js';
import { ACCEPTED_MESSAGE } from './service.js';

export function metadata(req) { return { ip: req.ip, userAgent: req.get('User-Agent')?.slice(0, 500) }; }
export function clearSessionCookies(res, config) {
  const options = { httpOnly: true, secure: config.isProduction, sameSite: 'strict', path: '/api/v1' };
  res.clearCookie('access_token', options);
  res.clearCookie('refresh_token', { ...options, path: '/api/v1/auth' });
}
function setSessionCookies(res, session, config) {
  const options = { httpOnly: true, secure: config.isProduction, sameSite: 'strict', path: '/api/v1' };
  res.cookie('access_token', session.accessToken, { ...options, maxAge: 900000 });
  res.cookie('refresh_token', session.refreshToken, { ...options, path: '/api/v1/auth', maxAge: 30 * 24 * 3600000 });
}
export function createAuthRouter({ service, config }) {
  const router = Router();
  const auth = authenticate({ config });
  const accepted = (res, status = 200) => res.status(status).json({ data: { message: ACCEPTED_MESSAGE } });
  const publicWrite = (schema, limit = 10, windowMs = 15 * 60000) => [rateLimit({ limit, windowMs }), requireJson, validate(schema)];
  router.post('/auth/register', ...publicWrite(registerSchema, 5, 3600000), async (req, res) => { await service.register(req.validated.body, metadata(req)); return accepted(res, 202); });
  router.post('/auth/resend-verification', ...publicWrite(emailSchema, 5, 3600000), async (req, res) => { await service.resend(req.validated.body.email); return accepted(res); });
  router.post('/auth/verify-email', ...publicWrite(verifySchema, 20), async (req, res) => { await service.verify(req.validated.body); return res.json({ data: { emailVerified: true } }); });
  router.post('/auth/login', ...publicWrite(loginSchema), async (req, res) => {
    const session = await service.login(req.validated.body, metadata(req)); setSessionCookies(res, session, config); return res.json({ data: session.data });
  });
  router.post('/auth/refresh', rateLimit({ limit: 60 }), async (req, res) => {
    try { const session = await service.refresh(req.cookies.refresh_token, metadata(req)); setSessionCookies(res, session, config); return res.json({ data: session.data }); }
    catch (error) { clearSessionCookies(res, config); throw error; }
  });
  router.post('/auth/logout', rateLimit({ limit: 60 }), async (req, res) => {
    await service.logout(req.cookies.refresh_token); clearSessionCookies(res, config); return res.json({ data: { loggedOut: true } });
  });
  router.post('/auth/forgot-password', ...publicWrite(emailSchema, 5, 3600000), async (req, res) => { await service.forgot(req.validated.body.email); return accepted(res); });
  router.post('/auth/reset-password', ...publicWrite(resetSchema, 10), async (req, res) => { await service.reset(req.validated.body); clearSessionCookies(res, config); return res.json({ data: { passwordReset: true } }); });
  router.get('/auth/me', auth, async (req, res) => res.json({ data: await service.me(req.user) }));
  return router;
}
