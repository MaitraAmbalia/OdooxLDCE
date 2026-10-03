import { AppError } from '../lib/AppError.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * DEV-ONLY stand-in for Person B's `authenticate`. DELETE BEFORE DEMO.
 * Reads identity from headers:  X-Dev-User: <uuid>   X-Dev-Permissions: a.b,c.d
 * Refuses to authenticate anyone when NODE_ENV=production.
 */
export function stubAuth(config) {
  return (req, _res, next) => {
    const id = req.get('X-Dev-User');
    if (config.isProduction || !id || !UUID.test(id)) {
      return next(new AppError('UNAUTHENTICATED', 401, 'Authentication required'));
    }
    const permissions = (req.get('X-Dev-Permissions') ?? '').split(',').map((p) => p.trim()).filter(Boolean);
    req.user = { id, permissions };
    return next();
  };
}
