import { rateLimit as expressRateLimit } from 'express-rate-limit';
import { AppError } from '../lib/AppError.js';

export function rateLimit(options = {}) {
  return expressRateLimit({
    windowMs: options.windowMs ?? 15 * 60 * 1000,
    limit: options.limit ?? 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
    keyGenerator: options.keyGenerator,
    handler: (req, _res, next) => {
      const resetTime = req.rateLimit?.resetTime;
      const retryAfterSeconds = resetTime
        ? Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
        : undefined;

      next(
        new AppError('RATE_LIMITED', 429, 'Too many requests', {
          retryAfterSeconds,
        }),
      );
    },
  });
}
