import { randomUUID } from 'node:crypto';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;

export function requestId(req, res, next) {
  const suppliedId = req.get('x-request-id');
  req.id = suppliedId && REQUEST_ID_PATTERN.test(suppliedId) ? suppliedId : randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}
