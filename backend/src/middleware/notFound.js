import { AppError } from '../lib/AppError.js';

export function notFound(req, _res, next) {
  next(new AppError('NOT_FOUND', 404, `Route ${req.method} ${req.originalUrl} was not found`));
}
