import { AppError } from '../../../lib/AppError.js';
import { hmacHex, safeEqualHex } from './signature.js';

const API = 'https://api.razorpay.com/v1';

/**
 * Razorpay (test or live, decided by the key pair). Uses the REST API through Node's
 * built-in fetch with Basic auth, so no SDK dependency.
 */
export class RazorpayProvider {
  name = 'RAZORPAY';

  constructor(config) {
    this.keyId = config.razorpayKeyId;
    this.keySecret = config.razorpayKeySecret;
    this.webhookSecret = config.paymentWebhookSecret;
  }

  // Small wrapper: POST JSON, throw a safe AppError (never leak Razorpay's body to clients).
  async #post(path, body) {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new AppError('GATEWAY_ERROR', 502, 'Payment gateway request failed', {
        gatewayStatus: res.status,
        gatewayCode: json?.error?.code,
      });
    }
    return json;
  }

  async createOrder({ amountPaise, receipt }) {
    const order = await this.#post('/orders', { amount: Number(amountPaise), currency: 'INR', receipt });
    return { gatewayOrderId: order.id, keyId: this.keyId };
  }

  // Razorpay checkout signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
  verifyCheckoutSignature({ gatewayOrderId, gatewayPaymentId, signature }) {
    return safeEqualHex(hmacHex(this.keySecret, `${gatewayOrderId}|${gatewayPaymentId}`), signature);
  }

  // Webhook signature = HMAC_SHA256(raw body, webhook secret) in X-Razorpay-Signature
  verifyWebhookSignature(rawBody, signature) {
    return safeEqualHex(hmacHex(this.webhookSecret, rawBody), signature);
  }

  async refund({ gatewayPaymentId, amountPaise, reason }) {
    const refund = await this.#post(`/payments/${gatewayPaymentId}/refund`, {
      amount: Number(amountPaise),
      notes: { reason },
    });
    return { refundId: refund.id };
  }
}
