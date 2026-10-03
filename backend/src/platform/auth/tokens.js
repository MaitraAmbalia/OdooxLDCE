import { SignJWT, jwtVerify } from 'jose';
import { accessClaimsSchema } from './claims.js';
import { AppError } from '../errors/AppError.js';

const key = (secret) => new TextEncoder().encode(secret);
export async function signAccessToken(claims, secret) {
  return new SignJWT(accessClaimsSchema.parse(claims)).setProtectedHeader({ alg: 'HS256', typ: 'skyline-access+jwt' }).sign(key(secret));
}
export async function verifyAccessToken(token, secret, now = new Date()) {
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ['HS256'], typ: 'skyline-access+jwt', currentDate: now });
    const claims = accessClaimsSchema.parse(payload);
    if (claims.iat > Math.floor(now.getTime() / 1000) + 5) throw new Error('Future issuance');
    return claims;
  } catch {
    throw new AppError('UNAUTHENTICATED', 401, 'A valid session is required');
  }
}
