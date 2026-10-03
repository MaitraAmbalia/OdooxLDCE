import { createHmac, timingSafeEqual } from 'node:crypto';

// HMAC-SHA256 as lowercase hex. Razorpay signs both checkout and webhook payloads this way.
export function hmacHex(secret, data) {
  return createHmac('sha256', secret).update(data).digest('hex');
}

// Constant-time compare. timingSafeEqual throws on length mismatch, so check length first.
export function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
