import { createHash, createHmac, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

export const randomToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token, secret) => createHmac('sha256', secret).update(token).digest('hex');
export function encryptPayload(payload, secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return { iv: iv.toString('base64'), body: body.toString('base64'), tag: cipher.getAuthTag().toString('base64') };
}
export function decryptPayload(payload, secret) {
  const cipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), Buffer.from(payload.iv, 'base64'));
  cipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  return JSON.parse(Buffer.concat([cipher.update(Buffer.from(payload.body, 'base64')), cipher.final()]).toString('utf8'));
}
