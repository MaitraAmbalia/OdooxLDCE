import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

// Opaque QR payloads: AES-256-GCM, so a scanned code reveals nothing (no ids) and can't be forged.
// Token = base64url(iv[12] | tag[16] | ciphertext).
const keyOf = (secret) => createHash('sha256').update(secret).digest();

export function sealQr(secret, payload) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyOf(secret), iv);
  const data = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}

// Returns the payload, or null for anything tampered, truncated or not ours.
export function openQr(secret, token) {
  try {
    const raw = Buffer.from(String(token).trim(), 'base64url');
    if (raw.length < 29) return null;
    const decipher = createDecipheriv('aes-256-gcm', keyOf(secret), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
