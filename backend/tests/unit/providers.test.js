import { describe, expect, it } from 'vitest';
import { MockProvider } from '../../src/modules/payments/providers/mock.provider.js';
import { RazorpayProvider } from '../../src/modules/payments/providers/razorpay.provider.js';
import { hmacHex, safeEqualHex } from '../../src/modules/payments/providers/signature.js';

describe('signature helpers', () => {
  it('accepts equal, rejects different and length-mismatched values without throwing', () => {
    const sig = hmacHex('s', 'data');
    expect(safeEqualHex(sig, sig)).toBe(true);
    expect(safeEqualHex(sig, hmacHex('s', 'other'))).toBe(false);
    expect(safeEqualHex(sig, 'short')).toBe(false);
    expect(safeEqualHex(sig, undefined)).toBe(false);
  });
});

describe('providers verify signatures', () => {
  const body = Buffer.from('{"event":"payment.captured"}');

  it('MockProvider webhook + checkout', () => {
    const p = new MockProvider({ paymentWebhookSecret: 'wh' });
    expect(p.verifyWebhookSignature(body, hmacHex('wh', body))).toBe(true);
    expect(p.verifyWebhookSignature(body, hmacHex('bad', body))).toBe(false);
    const sig = hmacHex('wh', 'order_1|pay_1');
    expect(p.verifyCheckoutSignature({ gatewayOrderId: 'order_1', gatewayPaymentId: 'pay_1', signature: sig })).toBe(true);
    expect(p.verifyCheckoutSignature({ gatewayOrderId: 'order_1', gatewayPaymentId: 'pay_2', signature: sig })).toBe(false);
  });

  it('RazorpayProvider uses key secret for checkout and webhook secret for webhooks', () => {
    const p = new RazorpayProvider({ razorpayKeyId: 'k', razorpayKeySecret: 'ks', paymentWebhookSecret: 'wh' });
    expect(p.verifyWebhookSignature(body, hmacHex('wh', body))).toBe(true);
    expect(p.verifyWebhookSignature(body, hmacHex('ks', body))).toBe(false);
    const sig = hmacHex('ks', 'order_1|pay_1');
    expect(p.verifyCheckoutSignature({ gatewayOrderId: 'order_1', gatewayPaymentId: 'pay_1', signature: sig })).toBe(true);
  });
});
