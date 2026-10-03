import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, emailSchema, resetSchema, verifySchema } from './auth.schemas.js';

const isProduction = process.env.NODE_ENV === 'production';

function clearSessionCookies(res) {
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/v1',
  };
  res.clearCookie('access_token', options);
  res.clearCookie('refresh_token', { ...options, path: '/api/v1/auth' });
}

function setSessionCookies(res, session) {
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
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

export function createAuthRouter({ service, authenticate }) {
  const router = Router();

  router.post('/auth/register', validate(registerSchema), async (req, res) => {
    const user = await service.register(req.validated.body, { ip: req.ip });
    return res.status(201).json({ data: { message: 'Registration successful', user } });
  });

  router.post('/auth/login', validate(loginSchema), async (req, res) => {
    const session = await service.login(req.validated.body, { ip: req.ip });
    setSessionCookies(res, session);
    return res.json({ data: session.data });
  });

  router.post('/auth/refresh', async (req, res) => {
    try {
      const session = await service.refresh(req.cookies.refresh_token, { ip: req.ip });
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
    return res.json({ data: await service.verifyEmail(req.validated.body) });
  });

  router.post('/auth/forgot-password', validate(emailSchema), async (req, res) => {
    return res.json({ data: await service.forgotPassword(req.validated.body) });
  });

  router.post('/auth/reset-password', validate(resetSchema), async (req, res) => {
    return res.json({ data: await service.resetPassword(req.validated.body) });
  });

  return router;
}
