import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { rateLimit } from '../../middleware/rateLimit.js';
import { requireJson } from '../../middleware/requireJson.js';
import { registerSchema, loginSchema, emailSchema, resetSchema, verifySchema } from './auth.schemas.js';

function clearSessionCookies(res, config) {
  const options = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/api/v1',
  };
  res.clearCookie('access_token', options);
  res.clearCookie('refresh_token', { ...options, path: '/api/v1/auth' });
}

function setSessionCookies(res, session, config) {
  const options = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/api/v1',
  };
  res.cookie('access_token', session.accessToken, {
    ...options,
    maxAge: 900000,
  });
  res.cookie('refresh_token', session.refreshToken, {
    ...options,
    path: '/api/v1/auth',
    maxAge: 30 * 24 * 3600000,
  });
}

export function createAuthRouter({ service, authenticate, config }) {
  const router = Router();

  const publicWrite = (schema, limit = 10, windowMs = 15 * 60000) => [
    rateLimit({ limit, windowMs }),
    requireJson,
    validate(schema),
  ];

  router.post('/auth/register', ...publicWrite(registerSchema, 5, 3600000), async (req, res) => {
    const user = await service.register(req.validated.body, { ip: req.ip });
    return res.status(201).json({ data: { message: 'Registration successful', user } });
  });

  router.post('/auth/login', ...publicWrite(loginSchema), async (req, res) => {
    const session = await service.login(req.validated.body, { ip: req.ip });
    setSessionCookies(res, session, config);
    return res.json({ data: session.data });
  });

  router.post('/auth/refresh', rateLimit({ limit: 60 }), async (req, res) => {
    try {
      const session = await service.refresh(req.cookies.refresh_token, { ip: req.ip });
      setSessionCookies(res, session, config);
      return res.json({ data: session.data });
    } catch (error) {
      clearSessionCookies(res, config);
      throw error;
    }
  });

  router.post('/auth/logout', rateLimit({ limit: 60 }), async (req, res) => {
    await service.logout(req.cookies.refresh_token);
    clearSessionCookies(res, config);
    return res.json({ data: { loggedOut: true } });
  });

  router.get('/auth/me', authenticate, async (req, res) => {
    return res.json({ data: await service.me(req.user) });
  });

  router.post('/auth/verify-email', ...publicWrite(verifySchema), async (req, res) => {
    return res.json({ data: await service.verifyEmail(req.validated.body) });
  });

  router.post('/auth/forgot-password', ...publicWrite(emailSchema), async (req, res) => {
    return res.json({ data: await service.forgotPassword(req.validated.body) });
  });

  router.post('/auth/reset-password', ...publicWrite(resetSchema), async (req, res) => {
    return res.json({ data: await service.resetPassword(req.validated.body) });
  });

  return router;
}
