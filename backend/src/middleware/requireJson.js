import { AppError } from '../lib/AppError.js';

export function requireJson(req, _res, next) {
  if (req.is('application/json')) return next();

  return next(
    new AppError(
      'UNSUPPORTED_MEDIA_TYPE',
      415,
      'Content-Type must be application/json',
    ),
  );
}
