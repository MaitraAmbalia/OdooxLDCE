import { randomUUID } from 'node:crypto';
import { hmacHex, safeEqualHex } from './signature.js';

/**
 * Default provider for dev/demo. No network. It signs and verifies with the same HMAC
 * scheme as Razorpay, so the webhook / confirm code paths are exercised for real.
 */
export class MockProvider {
  name = 'MOCK';

  constructor(config) {
    this.secret = config.paymentWebhookSecret;
  }

  async createOrder() {
    return { gatewayOrderId: `order_mock_${randomUUID()}`, keyId: 'mock_key' };
  }

  verifyCheckoutSignature({ gatewayOrderId, gatewayPaymentId, signature }) {
    return safeEqualHex(hmacHex(this.secret, `${gatewayOrderId}|${gatewayPaymentId}`), signature);
  }

  verifyWebhookSignature(rawBody, signature) {
    return safeEqualHex(hmacHex(this.secret, rawBody), signature);
  }

  async refund() {
    return { refundId: `rfnd_mock_${randomUUID()}` };
  }
}
