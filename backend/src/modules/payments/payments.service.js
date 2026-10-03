import { randomUUID } from 'node:crypto';
import { AppError } from '../../lib/AppError.js';
import { postIncome as stubPostIncome, LEDGER_CATEGORY_BY_PURPOSE } from '../../contracts/stubs.js';
import { createProvider } from './providers/provider.js';
import { sharedRegistry } from './payments.registry.js';
import { paymentsRepository as repo } from './payments.repository.js';

const notFound = () => new AppError('NOT_FOUND', 404, 'Payment not found');
const isUniqueViolation = (e) => e?.code === 'P2002';

// BigInt is not JSON-serialisable and paise amounts fit comfortably in a Number.
function toPublic(p) {
  return {
    id: p.id,
    purpose: p.purpose,
    refId: p.refId,
    amountPaise: Number(p.amountPaise),
    currency: 'INR',
    status: p.status,
    provider: p.provider,
    gatewayOrderId: p.gatewayOrderId,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
  };
}

/**
 * Payments business rules. Dependencies are injected so tests can swap provider/ledger/registry.
 */
export function createPaymentsService({
  prisma,
  config,
  logger,
  provider = createProvider(config),
  registry = sharedRegistry,
  postIncome = stubPostIncome, // swapped for finance.postIncome when the finance module lands
}) {
  // ---------------------------------------------------------------- createPayment
  // Contract function (called by memberships / tickets / merch checkout).
  // `amountPaise` MUST come from server-side pricing, never from the request body.
  async function createPayment({ userId, purpose, refId, amountPaise, idempotencyKey }) {
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      throw new AppError('VALIDATION_ERROR', 400, 'amountPaise must be a positive integer');
    }

    // Same key => same payment (checkout retried by the client or a network blip).
    const replay = async () => {
      const existing = await repo.findByIdempotencyKey(prisma, idempotencyKey);
      if (!existing) return null;
      const same =
        existing.userId === userId &&
        existing.purpose === purpose &&
        existing.refId === refId &&
        Number(existing.amountPaise) === amountPaise;
      if (!same) throw new AppError('IDEMPOTENCY_CONFLICT', 409, 'Idempotency-Key reused with a different request');
      return existing;
    };

    let payment = idempotencyKey ? await replay() : null;
    if (!payment) {
      // The id doubles as Razorpay's `receipt` (<= 40 chars), so generate it before the order.
      const id = randomUUID();
      const order = await provider.createOrder({ amountPaise, receipt: id });
      try {
        payment = await repo.create(prisma, {
          id,
          userId,
          purpose,
          refId,
          amountPaise: BigInt(amountPaise),
          provider: provider.name,
          gatewayOrderId: order.gatewayOrderId,
          idempotencyKey: idempotencyKey ?? null,
        });
      } catch (e) {
        // Two concurrent requests with the same key: the loser reads the winner's row.
        if (isUniqueViolation(e) && idempotencyKey) payment = await replay();
        else throw e;
      }
    }

    return {
      paymentId: payment.id,
      provider: payment.provider,
      gatewayOrderId: payment.gatewayOrderId,
      amountPaise: Number(payment.amountPaise),
      currency: 'INR',
      keyId: provider.keyId ?? 'mock_key',
    };
  }

  // ---------------------------------------------------------------- captured (the money path)
  // Used by the webhook, /confirm and /mock-complete, so all three behave identically.
  // Everything below happens in ONE transaction: PAID status + purpose handler + ledger entry.
  async function handleCaptured({ gatewayOrderId, gatewayPaymentId, amountPaise }) {
    return prisma.$transaction(async (tx) => {
      const payment = await repo.findByGatewayOrderId(tx, gatewayOrderId);
      if (!payment) {
        logger.warn({ gatewayOrderId }, 'capture for unknown order');
        return 'UNKNOWN_ORDER';
      }

      // Never fulfil if the gateway captured a different amount than we asked for.
      if (!Number.isSafeInteger(amountPaise) || BigInt(amountPaise) !== payment.amountPaise) {
        logger.error(
          { paymentId: payment.id, expected: Number(payment.amountPaise), captured: amountPaise },
          'ALERT: captured amount mismatch, not fulfilling',
        );
        return 'AMOUNT_MISMATCH';
      }

      // Compare-and-set: only one caller can flip CREATED/FAILED -> PAID. Replays get count 0.
      const { count } = await repo.markPaid(tx, payment.id, gatewayPaymentId);
      if (count === 0) {
        if (payment.gatewayPaymentId && payment.gatewayPaymentId !== gatewayPaymentId) {
          logger.error({ paymentId: payment.id, gatewayPaymentId }, 'ALERT: second capture for a paid order (refund manually)');
        }
        return 'ALREADY_PROCESSED';
      }

      const paid = await repo.findById(tx, payment.id);
      const handler = registry.get(paid.purpose);
      if (handler?.onPaid) await handler.onPaid(paid, tx);

      await postIncome(
        {
          category: LEDGER_CATEGORY_BY_PURPOSE[paid.purpose],
          amountPaise: Number(paid.amountPaise),
          sourceType: 'PAYMENT',
          sourceId: paid.id,
          description: `${paid.purpose} payment ${paid.gatewayPaymentId}`,
        },
        tx,
      );
      return 'FULFILLED';
    });
  }

  async function handleFailed({ gatewayOrderId }) {
    return prisma.$transaction(async (tx) => {
      const payment = await repo.findByGatewayOrderId(tx, gatewayOrderId);
      if (!payment) return 'UNKNOWN_ORDER';
      const { count } = await repo.markFailed(tx, payment.id);
      if (count === 0) return 'IGNORED'; // already paid / failed
      const handler = registry.get(payment.purpose);
      if (handler?.onFailed) await handler.onFailed(payment, tx); // e.g. release a reservation
      return 'FAILED';
    });
  }

  // ---------------------------------------------------------------- webhook
  // `rawBody` is the exact Buffer Razorpay sent (app.js mounts express.raw for this route).
  async function handleWebhook(rawBody, signature) {
    if (!Buffer.isBuffer(rawBody) || !provider.verifyWebhookSignature(rawBody, signature)) {
      throw new AppError('INVALID_SIGNATURE', 400, 'Invalid webhook signature');
    }

    let event;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new AppError('INVALID_PAYLOAD', 400, 'Webhook body is not valid JSON');
    }

    const entity = event?.payload?.payment?.entity;
    if (event?.event === 'payment.captured' && entity) {
      return handleCaptured({
        gatewayOrderId: entity.order_id,
        gatewayPaymentId: entity.id,
        amountPaise: entity.amount,
      });
    }
    if (event?.event === 'payment.failed' && entity) {
      return handleFailed({ gatewayOrderId: entity.order_id });
    }
    return 'IGNORED'; // other event types: acknowledge so the gateway stops retrying
  }

  // ---------------------------------------------------------------- owner endpoints
  // Other people's payments look like they don't exist (404, not 403).
  async function getOwned(userId, id) {
    const payment = await repo.findById(prisma, id);
    if (!payment || payment.userId !== userId) throw notFound();
    return payment;
  }

  async function get(userId, id) {
    return toPublic(await getOwned(userId, id));
  }

  // Client-side confirmation: speeds up the UI, the webhook stays authoritative.
  // The signature binds this order to this gateway payment id, and the order amount was fixed
  // server-side when we created it, so using our own stored amount here is safe.
  async function confirm(userId, id, { gatewayPaymentId, gatewaySignature }) {
    const payment = await getOwned(userId, id);
    const ok = provider.verifyCheckoutSignature({
      gatewayOrderId: payment.gatewayOrderId,
      gatewayPaymentId,
      signature: gatewaySignature,
    });
    if (!ok) throw new AppError('INVALID_SIGNATURE', 400, 'Invalid payment signature');

    await handleCaptured({
      gatewayOrderId: payment.gatewayOrderId,
      gatewayPaymentId,
      amountPaise: Number(payment.amountPaise),
    });
    return toPublic(await repo.findById(prisma, id));
  }

  // Demo helper. The route is not even mounted in production; the provider check stops it
  // from faking a payment that was created against real Razorpay.
  async function mockComplete(userId, id) {
    const payment = await getOwned(userId, id);
    if (payment.provider !== 'MOCK') throw new AppError('FORBIDDEN', 403, 'Only MOCK payments can be completed here');
    await handleCaptured({
      gatewayOrderId: payment.gatewayOrderId,
      gatewayPaymentId: `pay_mock_${randomUUID()}`,
      amountPaise: Number(payment.amountPaise),
    });
    return toPublic(await repo.findById(prisma, id));
  }

  // ---------------------------------------------------------------- refund
  // Contract function. Caller posts the ledger refund (finance.postRefund) in its own flow.
  // ponytail: a refund marks the payment REFUNDED even if partial; track partials with a
  // refunds table if the product needs several partial refunds per payment.
  async function refund(paymentId, amountPaise, reason) {
    const payment = await repo.findById(prisma, paymentId);
    if (!payment) throw notFound();
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0 || BigInt(amountPaise) > payment.amountPaise) {
      throw new AppError('VALIDATION_ERROR', 400, 'Invalid refund amount');
    }

    // Claim PAID -> REFUNDED first so two concurrent refunds can't both reach the gateway.
    const { count } = await repo.setStatus(prisma, paymentId, 'PAID', 'REFUNDED');
    if (count === 0) throw new AppError('INVALID_STATE_TRANSITION', 409, 'Only PAID payments can be refunded');

    try {
      return await provider.refund({ gatewayPaymentId: payment.gatewayPaymentId, amountPaise, reason });
    } catch (e) {
      await repo.setStatus(prisma, paymentId, 'REFUNDED', 'PAID'); // gateway said no: undo the claim
      throw e;
    }
  }

  return { createPayment, handleWebhook, handleCaptured, handleFailed, get, confirm, mockComplete, refund };
}
