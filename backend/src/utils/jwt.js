import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { AppError } from '../lib/AppError.js';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export const termRoleSchema = z.enum([
  'MENTOR', 'PRESIDENT', 'TREASURER', 'EVENT_HEAD', 'VOLUNTEER_HEAD', 'MARKETING_HEAD',
]);

export const membershipClaimsSchema = z.object({
  status: z.enum(['ACTIVE', 'LAPSED', 'PENDING', 'NONE']),
  activeSince: z.string().optional(),
  expiresAt: z.string().optional(),
}).strict();

export const accessClaimsSchema = z.object({
  sub: z.string().uuid(),
  name: z.string().min(1),
  emailVerified: z.boolean(),
  membership: membershipClaimsSchema,
  isVolunteer: z.boolean(),
  roles: z.array(termRoleSchema).max(6),
  permissions: z.array(z.string()).max(100),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
}).strict();

const key = (secret) => new TextEncoder().encode(secret);

/**
 * Signs 15-minute JWT access token with user claims.
 */
export async function signAccessToken(claims, secret) {
  return new SignJWT(accessClaimsSchema.parse(claims))
    .setProtectedHeader({ alg: 'HS256', typ: 'skyline-access+jwt' })
    .sign(key(secret));
}

/**
 * Verifies JWT access token and decodes claims.
 */
export async function verifyAccessToken(token, secret, now = new Date()) {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: ['HS256'],
      typ: 'skyline-access+jwt',
      currentDate: now,
    });
    return accessClaimsSchema.parse(payload);
  } catch {
    throw new AppError('UNAUTHENTICATED', 401, 'A valid session is required');
  }
}
