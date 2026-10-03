import { verifyAccessToken } from '../utils/jwt.js';
import { getConfig } from '../config/env.js';
import { AppError } from '../lib/AppError.js';

/**
 * Authentication middleware. Extracts and validates JWT from cookie or header.
 */
export function authenticate({ optional = false, config } = {}) {
  return async (req, _res, next) => {
    const token = req.cookies?.access_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token && optional) return next();

    try {
      if (!token) throw new AppError('UNAUTHENTICATED', 401, 'A valid session is required');
      req.user = await verifyAccessToken(token, (config ?? getConfig()).accessSecret);
      req.user.id = req.user.sub;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

/**
 * Authorization middleware. Checks if authenticated user has any of the required permissions.
 */
export function authorize(...permissions) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('UNAUTHENTICATED', 401, 'A valid session is required'));
    if (!permissions.some((p) => req.user.permissions?.includes(p))) {
      return next(new AppError('FORBIDDEN', 403, 'Permission is required'));
    }
    return next();
  };
}

/**
 * Require active club membership middleware.
 */
export function requireMember(req, _res, next) {
  if (!req.user) return next(new AppError('UNAUTHENTICATED', 401, 'A valid session is required'));
  if (!req.user.emailVerified) return next(new AppError('EMAIL_NOT_VERIFIED', 403, 'Verify your email first'));
  if (req.user.membership?.status !== 'ACTIVE') {
    return next(new AppError('NOT_A_MEMBER', 403, 'Active membership is required'));
  }
  return next();
}
