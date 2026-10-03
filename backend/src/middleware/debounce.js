import { AppError } from '../lib/AppError.js';

/**
 * Express middleware to debounce rapid, identical requests from the same user or IP.
 * Ideal for preventing accidental double-submits on checkouts, registrations, or expensive endpoints.
 *
 * @param {Object} options
 * @param {number} options.windowMs Milliseconds to debounce requests within (default: 500ms).
 * @param {Function} options.keyGenerator Custom key function, defaults to userId/ip + method + path.
 */
export function debounceRequest({
  windowMs = 500,
  keyGenerator = (req) => `${req.user?.id || req.ip}:${req.method}:${req.originalUrl || req.url}`,
} = {}) {
  const recentRequests = new Map();

  return (req, _res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const lastRequestTime = recentRequests.get(key);

    if (lastRequestTime && now - lastRequestTime < windowMs) {
      return next(
        new AppError(
          'DUPLICATE_REQUEST',
          429,
          'Please wait a moment before resubmitting.',
        ),
      );
    }

    recentRequests.set(key, now);

    // Clean up expired keys periodically to prevent memory growth
    setTimeout(() => {
      if (recentRequests.get(key) === now) {
        recentRequests.delete(key);
      }
    }, windowMs * 2);

    next();
  };
}
