import { AppError } from '../lib/AppError.js';

/**
 * DEV-ONLY stand-in for Person B's `authorize(permission)`. DELETE BEFORE DEMO.
 * Checks the permission list that `stubAuth` put on req.user.
 */
export function requirePermission(key) {
  return (req, _res, next) => {
    if (req.user?.permissions?.includes(key)) return next();
    return next(new AppError('FORBIDDEN', 403, 'You do not have permission to do this'));
  };
}
