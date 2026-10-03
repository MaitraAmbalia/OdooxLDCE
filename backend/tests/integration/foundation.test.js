import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import pino from 'pino';
import { createApp } from '../../src/app.js';

const config = {
  nodeEnv: 'test',
  isProduction: true,
  corsOrigin: 'http://localhost:5173',
  trustProxy: false,
  logLevel: 'silent',
  jsonBodyLimit: '1mb',
};

function buildApp(queryError) {
  const query = queryError
    ? vi.fn().mockRejectedValue(queryError)
    : vi.fn().mockResolvedValue([{ result: 1 }]);
  const prisma = { $queryRaw: query };
  const logger = pino({ level: 'silent' });
  return { app: createApp({ config, prisma, logger }), prisma };
}

describe('backend foundation', () => {
  it('returns database-aware health information', async () => {
    const { app, prisma } = buildApp();
    const response = await request(app).get('/api/v1/health').expect(200);

    expect(response.body.data).toMatchObject({ status: 'ok', db: 'up' });
    expect(response.headers['x-request-id']).toBeTruthy();
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
  });

  it('reports an unavailable database without exposing internals', async () => {
    const { app } = buildApp(new Error('database secret'));
    const response = await request(app).get('/api/v1/health').expect(503);

    expect(response.body.data).toMatchObject({ status: 'degraded', db: 'down' });
    expect(JSON.stringify(response.body)).not.toContain('database secret');
  });

  it('uses the standard error envelope for unknown routes', async () => {
    const { app } = buildApp();
    const response = await request(app).get('/api/v1/unknown').expect(404);

    expect(response.body.error).toMatchObject({
      code: 'NOT_FOUND',
      requestId: response.headers['x-request-id'],
    });
    expect(response.body.error.stack).toBeUndefined();
  });

  it('rejects browser origins outside the allowlist', async () => {
    const { app } = buildApp();
    const response = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://attacker.example')
      .expect(403);

    expect(response.body.error.code).toBe('CORS_ORIGIN_DENIED');
  });

  it('does not advertise Express', async () => {
    const { app } = buildApp();
    const response = await request(app).get('/api/v1/health');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
