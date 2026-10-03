import { randomUUID } from 'node:crypto';
import { AppError } from '../lib/AppError.js';

function normalizeError(error) {
  if (error instanceof AppError) return error;

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return new AppError('INVALID_JSON', 400, 'Request body contains invalid JSON');
  }

  return new AppError('INTERNAL', 500, 'An unexpected error occurred');
}

export function errorHandler(options = {}) {
  const isProduction = options.isProduction ?? true;

  return (error, req, res, next) => {
    if (res.headersSent) return next(error);

    const normalized = normalizeError(error);
    const requestId = req.id ?? randomUUID();
    res.setHeader('X-Request-Id', requestId);

    const logContext = { err: error, requestId };
    if (normalized.status >= 500) req.log?.error(logContext, 'Request failed');
    else req.log?.warn(logContext, 'Request rejected');

    const payload = {
      error: {
        code: normalized.code,
        message: normalized.message,
        requestId,
      },
    };

    if (normalized.details !== undefined) payload.error.details = normalized.details;
    if (!isProduction && error.stack) payload.error.stack = error.stack;

    return res.status(normalized.status).json(payload);
  };
}
