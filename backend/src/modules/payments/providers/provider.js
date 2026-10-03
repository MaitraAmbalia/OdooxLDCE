import { MockProvider } from './mock.provider.js';
import { RazorpayProvider } from './razorpay.provider.js';

/**
 * Gateway adapter interface. Every provider implements:
 *
 *   createOrder({ amountPaise, receipt })            -> { gatewayOrderId, keyId }
 *   verifyCheckoutSignature({ gatewayOrderId, gatewayPaymentId, signature }) -> boolean
 *   verifyWebhookSignature(rawBodyBuffer, signatureHeader)                   -> boolean
 *   refund({ gatewayPaymentId, amountPaise, reason })                        -> { refundId }
 *
 * Verification is synchronous and constant-time; network calls (createOrder, refund) are async.
 */
export function createProvider(config) {
  return config.paymentProvider === 'RAZORPAY' ? new RazorpayProvider(config) : new MockProvider(config);
}
