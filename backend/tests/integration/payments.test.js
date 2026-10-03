import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import pino from 'pino';
import { createApp } from '../../src/app.js';
import { getPrismaClient, disconnectPrisma } from '../../src/db/prisma.js';
import { createPaymentsService } from '../../src/modules/payments/payments.service.js';
import { createRegistry } from '../../src/modules/payments/payments.registry.js';
import { hmacHex } from '../../src/modules/payments/providers/signature.js';

// Real Postgres (DATABASE_URL from backend/.env). Ledger rows are append-only (DB trigger), so
// tests use fresh UUIDs and assert per source id instead of cleaning up.
const SECRET = 'test-webhook-secret';
const baseConfig = { nodeEnv: 'test', isProduction: false, corsOrigin: 'http://localhost:5173', trustProxy: false, logLevel: 'silent', jsonBodyLimit: '1mb', paymentProvider: 'MOCK', paymentWebhookSecret: SECRET };

const prisma = getPrismaClient();
const logger = pino({ level: 'silent' });
const registry = createRegistry();
const onPaid = vi.fn();
registry.register('MEMBERSHIP', onPaid);

let service, app, userX, userY;

const newUser = () =>
  prisma.user.create({ data: { email: `${randomUUID()}@test.local`, passwordHash: 'x', name: 'T', studentId: randomUUID() } });
const dev = (u) => ({ 'X-Dev-User': u.id });
const makePayment = (user, over = {}) =>
  service.createPayment({ userId: user.id, purpose: 'MEMBERSHIP', refId: randomUUID(), amountPaise: 50000, ...over });
const capturedBody = (p, amount = 50000, payId = `pay_${randomUUID()}`) =>
  JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: payId, order_id: p.gatewayOrderId, amount } } } });
const sendWebhook = (body, sig = hmacHex(SECRET, body)) =>
  request(app).post('/api/v1/payments/webhook').set('Content-Type', 'application/json').set('X-Razorpay-Signature', sig).send(body);
const ledgerCount = (paymentId) => prisma.ledgerEntry.count({ where: { sourceType: 'PAYMENT', sourceId: paymentId } });

beforeAll(async () => {
  service = createPaymentsService({ prisma, config: baseConfig, logger, registry });
  app = createApp({ config: baseConfig, prisma, logger, paymentsService: service });
  [userX, userY] = await Promise.all([newUser(), newUser()]);
});
afterAll(() => disconnectPrisma());

describe('webhook', () => {
  it('rejects a tampered signature with 400 and changes nothing', async () => {
    const p = await makePayment(userX);
    await sendWebhook(capturedBody(p), 'deadbeef').expect(400);
    expect((await service.get(userX.id, p.paymentId)).status).toBe('CREATED');
    expect(await ledgerCount(p.paymentId)).toBe(0);
  });

  it('replayed 5x (concurrently) gives one PAID, one ledger entry, one handler call', async () => {
    onPaid.mockClear();
    const p = await makePayment(userX);
    const body = capturedBody(p, 50000, `pay_${randomUUID()}`);
    const results = await Promise.all(Array.from({ length: 5 }, () => sendWebhook(body)));
    results.forEach((r) => expect(r.status).toBe(200));
    expect((await service.get(userX.id, p.paymentId)).status).toBe('PAID');
    expect(await ledgerCount(p.paymentId)).toBe(1);
    expect(onPaid).toHaveBeenCalledTimes(1);
  });

  it('does not fulfil when the captured amount differs', async () => {
    const p = await makePayment(userX);
    await sendWebhook(capturedBody(p, 100)).expect(200);
    expect((await service.get(userX.id, p.paymentId)).status).toBe('CREATED');
    expect(await ledgerCount(p.paymentId)).toBe(0);
  });

  it('payment.failed marks FAILED, and a later capture can still succeed', async () => {
    const p = await makePayment(userX);
    const failed = JSON.stringify({ event: 'payment.failed', payload: { payment: { entity: { id: `pay_${randomUUID()}`, order_id: p.gatewayOrderId } } } });
    await sendWebhook(failed).expect(200);
    expect((await service.get(userX.id, p.paymentId)).status).toBe('FAILED');
    await sendWebhook(capturedBody(p)).expect(200);
    expect((await service.get(userX.id, p.paymentId)).status).toBe('PAID');
  });

  it('rolls back everything if the purpose handler throws (webhook 500 => gateway retries)', async () => {
    const boom = createRegistry();
    boom.register('MEMBERSHIP', async () => { throw new Error('handler failed'); });
    const svc = createPaymentsService({ prisma, config: baseConfig, logger, registry: boom });
    const a = createApp({ config: baseConfig, prisma, logger, paymentsService: svc });
    const p = await svc.createPayment({ userId: userX.id, purpose: 'MEMBERSHIP', refId: randomUUID(), amountPaise: 50000 });
    const body = capturedBody(p);
    await request(a).post('/api/v1/payments/webhook').set('Content-Type', 'application/json').set('X-Razorpay-Signature', hmacHex(SECRET, body)).send(body).expect(500);
    expect((await svc.get(userX.id, p.paymentId)).status).toBe('CREATED');
    expect(await ledgerCount(p.paymentId)).toBe(0);
  });
});

describe('createPayment', () => {
  it('is idempotent on the key and conflicts when the request differs', async () => {
    const key = randomUUID();
    const refId = randomUUID();
    const a = await makePayment(userX, { idempotencyKey: key, refId });
    const b = await makePayment(userX, { idempotencyKey: key, refId });
    expect(b.paymentId).toBe(a.paymentId);
    await expect(makePayment(userX, { idempotencyKey: key, refId, amountPaise: 1 })).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
  });

  it('rejects non-positive or fractional amounts', async () => {
    await expect(makePayment(userX, { amountPaise: 0 })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await expect(makePayment(userX, { amountPaise: 10.5 })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('owner endpoints', () => {
  it("user Y gets 404 for user X's payment; X can read it", async () => {
    const p = await makePayment(userX);
    await request(app).get(`/api/v1/payments/${p.paymentId}`).set(dev(userY)).expect(404);
    const ok = await request(app).get(`/api/v1/payments/${p.paymentId}`).set(dev(userX)).expect(200);
    expect(ok.body.data.status).toBe('CREATED');
  });

  it('requires authentication', async () => {
    await request(app).get(`/api/v1/payments/${randomUUID()}`).expect(401);
  });

  it('mock-complete pays through the same path as the webhook', async () => {
    const p = await makePayment(userX);
    const res = await request(app).post(`/api/v1/payments/${p.paymentId}/mock-complete`).set(dev(userX)).expect(200);
    expect(res.body.data.status).toBe('PAID');
    expect(await ledgerCount(p.paymentId)).toBe(1);
    await request(app).post(`/api/v1/payments/${p.paymentId}/mock-complete`).set(dev(userY)).expect(404);
  });

  it('mock-complete does not exist in production', async () => {
    const prodConfig = { ...baseConfig, isProduction: true };
    const prodApp = createApp({ config: prodConfig, prisma, logger, paymentsService: service, authenticate: (req, _r, n) => { req.user = { id: userX.id }; n(); } });
    const p = await makePayment(userX);
    await request(prodApp).post(`/api/v1/payments/${p.paymentId}/mock-complete`).expect(404);
  });

  it('confirm verifies the checkout signature', async () => {
    const p = await makePayment(userX);
    const gatewayPaymentId = `pay_${randomUUID()}`;
    const bad = await request(app).post(`/api/v1/payments/${p.paymentId}/confirm`).set(dev(userX)).send({ gatewayPaymentId, gatewaySignature: 'nope' });
    expect(bad.status).toBe(400);
    const sig = hmacHex(SECRET, `${p.gatewayOrderId}|${gatewayPaymentId}`);
    const good = await request(app).post(`/api/v1/payments/${p.paymentId}/confirm`).set(dev(userX)).send({ gatewayPaymentId, gatewaySignature: sig }).expect(200);
    expect(good.body.data.status).toBe('PAID');
  });
});

describe('refund', () => {
  it('refunds a PAID payment once; a second refund conflicts; unpaid is rejected', async () => {
    const unpaid = await makePayment(userX);
    await expect(service.refund(unpaid.paymentId, 50000, 'r')).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });

    const p = await makePayment(userX);
    await service.handleCaptured({ gatewayOrderId: p.gatewayOrderId, gatewayPaymentId: `pay_${randomUUID()}`, amountPaise: 50000 });
    const out = await service.refund(p.paymentId, 50000, 'event cancelled');
    expect(out.refundId).toMatch(/^rfnd_mock_/);
    expect((await service.get(userX.id, p.paymentId)).status).toBe('REFUNDED');
    await expect(service.refund(p.paymentId, 50000, 'again')).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
  });
});
