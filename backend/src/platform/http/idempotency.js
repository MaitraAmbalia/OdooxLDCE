import { createHash } from 'node:crypto';
import { transaction, lock } from '../db/clients.js';
import { AppError } from '../errors/AppError.js';

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
export async function withIdempotency(client, { userId, key, request }, work) {
  if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(key)) throw new AppError('VALIDATION_ERROR', 400, 'A valid Idempotency-Key is required');
  const requestHash = createHash('sha256').update(JSON.stringify(canonical(request))).digest('hex');
  return transaction(client, async (tx) => {
    await lock(tx, `idempotency:${userId}:${key}`);
    const existing = await tx.idempotencyKey.findUnique({ where: { userId_key: { userId, key } } });
    if (existing && existing.expiresAt > new Date()) {
      if (existing.requestHash !== requestHash) throw new AppError('IDEMPOTENCY_CONFLICT', 409, 'Key was used for another request');
      return { status: existing.statusCode, data: existing.response };
    }
    if (existing) await tx.idempotencyKey.delete({ where: { id: existing.id } });
    const result = await work(tx);
    await tx.idempotencyKey.create({ data: { userId, key, requestHash, statusCode: result.status,
      response: result.data, expiresAt: new Date(Date.now() + 24 * 3600000) } });
    return result;
  });
}
export function idempotency({ client, handler }) {
  return async (req, res) => {
    if (!req.user) throw new AppError('UNAUTHENTICATED', 401, 'A valid session is required');
    const result = await withIdempotency(await client(), { userId: req.user.sub,
      key: req.get('Idempotency-Key'), request: { method: req.method, path: req.originalUrl, body: req.validated?.body ?? req.body } },
    (tx) => handler(req, tx));
    return res.status(result.status).json(result.data);
  };
}
