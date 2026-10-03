import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, emailSchema, resetSchema, verifySchema } from './auth.schemas.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/api/v1',
};

function clearSessionCookies(res) {
  res.clearCookie('access_token', COOKIE_OPTIONS);
  res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/api/v1/auth' });
}

function setSessionCookies(res, session) {
  res.cookie('access_token', session.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 mins
  });
  res.cookie('refresh_token', session.refreshToken, {
    ...COOKIE_OPTIONS,
    path: '/api/v1/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

export function createAuthRouter({ service, authenticate }) {
  const router = Router();

  router.post('/auth/register', validate(registerSchema), async (req, res) => {
    const user = await service.register(req.body);
    return res.status(201).json({ data: { message: 'Registration successful', user } });
  });

  router.post('/auth/login', validate(loginSchema), async (req, res) => {
    const session = await service.login(req.body);
    setSessionCookies(res, session);
    return res.json({ data: session.data });
  });

  router.post('/auth/refresh', async (req, res) => {
    try {
      const session = await service.refresh(req.cookies.refresh_token);
      setSessionCookies(res, session);
      return res.json({ data: session.data });
    } catch (error) {
      clearSessionCookies(res);
      throw error;
    }
  });

  router.post('/auth/logout', async (req, res) => {
    await service.logout(req.cookies.refresh_token);
    clearSessionCookies(res);
    return res.json({ data: { loggedOut: true } });
  });

  router.get('/auth/me', authenticate, async (req, res) => {
    return res.json({ data: await service.me(req.user) });
  });

  router.post('/auth/verify-email', validate(verifySchema), async (req, res) => {
    return res.json({ data: await service.verifyEmail(req.body) });
  });

  router.post('/auth/forgot-password', validate(emailSchema), async (req, res) => {
    return res.json({ data: await service.forgotPassword(req.body) });
  });

  router.post('/auth/reset-password', validate(resetSchema), async (req, res) => {
    return res.json({ data: await service.resetPassword(req.body) });
  });

  return router;
}
