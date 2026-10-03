import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { AppError } from '../../lib/AppError.js';
import { postIncome } from '../finance/finance.service.js';

// Ledger category per payment purpose (arch §5.3).
const CATEGORY = { MEMBERSHIP: 'DUES', TICKET: 'TICKETS', MERCH_ORDER: 'MERCH' };

// Other modules register what happens when a payment for their purpose is PAID / FAILED, e.g.
//   registerPurposeHandler('MEMBERSHIP', async (payment, tx) => { ...activate membership... });
// The handler runs inside the webhook transaction, so it commits or rolls back with the payment.
const handlers = new Map();
export const registerPurposeHandler = (purpose, onPaid, { onFailed } = {}) => handlers.set(purpose, { onPaid, onFailed });

const sign = (secret, data) => createHmac('sha256', secret).update(data).digest('hex');
const sameSig = (expected, given) =>
  typeof given === 'string' && expected.length === given.length && timingSafeEqual(Buffer.from(expected), Buffer.from(given));
const notFound = () => new AppError('NOT_FOUND', 404, 'Payment not found');

const toPublic = (p) => ({
  id: p.id, purpose: p.purpose, refId: p.refId, amountPaise: Number(p.amountPaise), currency: 'INR',
  status: p.status, provider: p.provider, gatewayOrderId: p.gatewayOrderId, paidAt: p.paidAt, createdAt: p.createdAt,
});

export function createPaymentsService({ prisma, config, logger }) {
  // Minimal Razorpay REST call (Basic auth with the key pair; test keys = test mode).
  async function razorpay(path, body) {
    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
      throw new AppError('PAYMENTS_NOT_CONFIGURED', 503, 'Payment gateway is not configured');
    }
    const auth = Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString('base64');
    const res = await fetch(`https://api.razorpay.com/v1${path}`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new AppError('GATEWAY_ERROR', 502, 'Payment gateway request failed', { gatewayCode: json?.error?.code });
    return json;
  }

  // Contract function (called by membership / ticket / merch checkout).
  // `amountPaise` must come from server-side pricing, never from the client.
  async function createPayment({ userId, purpose, refId, amountPaise, idempotencyKey }) {
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      throw new AppError('VALIDATION_ERROR', 400, 'amountPaise must be a positive integer');
    }
    let payment = idempotencyKey ? await prisma.payment.findUnique({ where: { idempotencyKey } }) : null;
    if (!payment) {
      const id = randomUUID(); // doubles as Razorpay's `receipt`
      // No Razorpay keys outside production = MOCK payment, completed via /mock-complete.
      const mock = !config.isProduction && (!config.razorpayKeyId || !config.razorpayKeySecret);
      const order = mock ? { id: `order_mock_${id}` } : await razorpay('/orders', { amount: amountPaise, currency: 'INR', receipt: id });
      try {
        payment = await prisma.payment.create({
          data: { id, userId, purpose, refId, amountPaise: BigInt(amountPaise), provider: mock ? 'MOCK' : 'RAZORPAY', gatewayOrderId: order.id, idempotencyKey: idempotencyKey ?? null },
        });
      } catch (e) {
        if (e.code !== 'P2002' || !idempotencyKey) throw e; // two requests with the same key: use the winner's row
        payment = await prisma.payment.findUnique({ where: { idempotencyKey } });
      }
    }
    return {
      paymentId: payment.id, provider: payment.provider, gatewayOrderId: payment.gatewayOrderId,
      amountPaise: Number(payment.amountPaise), currency: 'INR', keyId: config.razorpayKeyId,
    };
  }

  // The money path, shared by webhook, /confirm and /mock-complete. ONE transaction:
  // flip to PAID (only once), run the purpose handler, post the ledger entry.
  function handleCaptured({ gatewayOrderId, gatewayPaymentId, amountPaise }) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { gatewayOrderId } });
      if (!payment) return 'UNKNOWN_ORDER';
      if (!Number.isSafeInteger(amountPaise) || BigInt(amountPaise) !== payment.amountPaise) {
        logger.error({ paymentId: payment.id, captured: amountPaise }, 'ALERT: captured amount mismatch, not fulfilling');
        return 'AMOUNT_MISMATCH';
      }
      // Compare-and-set: only one caller wins CREATED/FAILED -> PAID; a replay updates 0 rows.
      const { count } = await tx.payment.updateMany({
        where: { id: payment.id, gatewayPaymentId: null, status: { in: ['CREATED', 'FAILED'] } },
        data: { status: 'PAID', gatewayPaymentId, paidAt: new Date() },
      });
      if (count === 0) return 'ALREADY_PROCESSED';

      const paid = await tx.payment.findUnique({ where: { id: payment.id } });
      await handlers.get(paid.purpose)?.onPaid?.(paid, tx);
      await postIncome(
        { category: CATEGORY[paid.purpose], amountPaise: Number(paid.amountPaise), sourceType: 'PAYMENT', sourceId: paid.id, description: `${paid.purpose} payment ${gatewayPaymentId}` },
        tx,
      );
      return 'FULFILLED';
    });
  }

  // `rawBody` is the exact Buffer Razorpay sent (app.js mounts express.raw for this route).
  async function handleWebhook(rawBody, signature) {
    if (!config.paymentWebhookSecret) throw new AppError('PAYMENTS_NOT_CONFIGURED', 503, 'Payment gateway is not configured');
    if (!Buffer.isBuffer(rawBody) || !sameSig(sign(config.paymentWebhookSecret, rawBody), signature)) {
      throw new AppError('INVALID_SIGNATURE', 400, 'Invalid webhook signature');
    }
    const event = JSON.parse(rawBody.toString('utf8'));
    const p = event?.payload?.payment?.entity;
    if (event?.event === 'payment.captured' && p) {
      return handleCaptured({ gatewayOrderId: p.order_id, gatewayPaymentId: p.id, amountPaise: p.amount });
    }
    if (event?.event === 'payment.failed' && p) {
      return prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({ where: { gatewayOrderId: p.order_id } });
        if (!payment) return 'UNKNOWN_ORDER';
        const { count } = await tx.payment.updateMany({ where: { id: payment.id, status: 'CREATED' }, data: { status: 'FAILED' } });
        if (count) await handlers.get(payment.purpose)?.onFailed?.(payment, tx); // e.g. release a reservation
        return count ? 'FAILED' : 'IGNORED';
      });
    }
    return 'IGNORED'; // other events: acknowledge so the gateway stops retrying
  }

  // Someone else's payment looks like it does not exist (404, not 403).
  async function getOwned(userId, id) {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment || payment.userId !== userId) throw notFound();
    return payment;
  }

  // keyId is Razorpay's public key; the checkout page needs it to open the payment popup.
  const get = async (userId, id) => {
    const p = toPublic(await getOwned(userId, id));
    return p.provider === 'RAZORPAY' ? { ...p, keyId: config.razorpayKeyId } : p;
  };

  // Client-side confirmation after Razorpay checkout. The signature binds this order to the
  // payment id, and the order amount was fixed server-side, so our stored amount is safe to use.
  async function confirm(userId, id, { gatewayPaymentId, gatewaySignature }) {
    const payment = await getOwned(userId, id);
    const expected = sign(config.razorpayKeySecret ?? '', `${payment.gatewayOrderId}|${gatewayPaymentId}`);
    if (!config.razorpayKeySecret || !sameSig(expected, gatewaySignature)) {
      throw new AppError('INVALID_SIGNATURE', 400, 'Invalid payment signature');
    }
    await handleCaptured({ gatewayOrderId: payment.gatewayOrderId, gatewayPaymentId, amountPaise: Number(payment.amountPaise) });
    return get(userId, id);
  }

  // DEV SHORTCUT (route not mounted in production): pretends the gateway captured the payment.
  async function mockComplete(userId, id) {
    const payment = await getOwned(userId, id);
    if (payment.provider !== 'MOCK') throw new AppError('FORBIDDEN', 403, 'Only MOCK payments can be completed here');
    await handleCaptured({ gatewayOrderId: payment.gatewayOrderId, gatewayPaymentId: `pay_mock_${randomUUID()}`, amountPaise: Number(payment.amountPaise) });
    return get(userId, id);
  }

  // Contract function (event/ticket cancel). The caller posts the ledger refund (finance.postRefund).
  // ponytail: any successful refund marks the payment REFUNDED, even a partial one.
  async function refund(paymentId, amountPaise, reason) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw notFound();
    if (payment.status !== 'PAID') throw new AppError('INVALID_STATE_TRANSITION', 409, 'Only PAID payments can be refunded');
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0 || BigInt(amountPaise) > payment.amountPaise) {
      throw new AppError('VALIDATION_ERROR', 400, 'Invalid refund amount');
    }
    const r = payment.provider === 'MOCK'
      ? { id: `rfnd_mock_${randomUUID()}` }
      : await razorpay(`/payments/${payment.gatewayPaymentId}/refund`, { amount: amountPaise, notes: { reason } });
    await prisma.payment.update({ where: { id: paymentId }, data: { status: 'REFUNDED' } });
    return { refundId: r.id };
  }

  return { createPayment, handleWebhook, get, confirm, mockComplete, refund };
}
