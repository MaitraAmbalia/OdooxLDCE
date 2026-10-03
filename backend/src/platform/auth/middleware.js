import { verifyAccessToken } from './tokens.js';
import { getConfig } from '../../config/env.js';
import { AppError } from '../errors/AppError.js';

export function authenticate({ optional = false, config } = {}) {
  return async (req, _res, next) => {
    const token = req.cookies?.access_token;
    if (!token && optional) return next();
    try {
      if (!token) throw new AppError('UNAUTHENTICATED', 401, 'A valid session is required');
      req.user = await verifyAccessToken(token, (config ?? getConfig()).accessSecret);
      req.user.id = req.user.sub; // Compatibility for Person A's existing payment controllers.
      return next();
    } catch (error) { return next(error); }
  };
}
export function authorize(...permissions) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('UNAUTHENTICATED', 401, 'A valid session is required'));
    if (!permissions.some((permission) => req.user.permissions.includes(permission))) return next(new AppError('FORBIDDEN', 403, 'Permission is required'));
    return next();
  };
}
export function requireMember(req, _res, next) {
  if (!req.user) return next(new AppError('UNAUTHENTICATED', 401, 'A valid session is required'));
  if (!req.user.emailVerified) return next(new AppError('EMAIL_NOT_VERIFIED', 403, 'Verify your email first'));
  if (req.user.membership.status !== 'ACTIVE') return next(new AppError('NOT_A_MEMBER', 403, 'Active membership is required'));
  return next();
}
