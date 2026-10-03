import argon2 from 'argon2';
import { createHash, createHmac, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

/**
 * Hashes password using Argon2id with OWASP-recommended parameters.
 */
export async function hashPassword(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

/**
 * Verifies password against an Argon2id hash.
 */
export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Generates cryptographically secure random base64url token.
 */
export const randomToken = () => randomBytes(32).toString('base64url');

/**
 * Creates HMAC-SHA256 hash of a token using application secret.
 */
export const hashToken = (token, secret) => createHmac('sha256', secret).update(token).digest('hex');

/**
 * Encrypts payload with AES-256-GCM.
 */
export function encryptPayload(payload, secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return {
    iv: iv.toString('base64'),
    body: body.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

/**
 * Decrypts payload with AES-256-GCM.
 */
export function decryptPayload(payload, secret) {
  const cipher = createDecipheriv(
    'aes-256-gcm',
    createHash('sha256').update(secret).digest(),
    Buffer.from(payload.iv, 'base64')
  );
  cipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  return JSON.parse(Buffer.concat([cipher.update(Buffer.from(payload.body, 'base64')), cipher.final()]).toString('utf8'));
}
