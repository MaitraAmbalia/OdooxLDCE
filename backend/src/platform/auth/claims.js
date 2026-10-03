import { z } from 'zod';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const termRoleSchema = z.enum([
  'MENTOR', 'PRESIDENT', 'TREASURER', 'EVENT_HEAD', 'VOLUNTEER_HEAD', 'MARKETING_HEAD',
]);

export const membershipClaimsSchema = z.object({
  status: z.enum(['ACTIVE', 'LAPSED', 'PENDING', 'NONE']),
  activeSince: z.iso.datetime({ offset: true }).optional(),
  expiresAt: z.iso.datetime({ offset: true }).optional(),
}).strict();

// Only term roles cross the boundary; scoped rights stay inside their context.
export const accessClaimsSchema = z.object({
  sub: z.uuid(),
  name: z.string().min(1),
  emailVerified: z.boolean(),
  membership: membershipClaimsSchema,
  isVolunteer: z.boolean(),
  roles: z.array(termRoleSchema).max(6).refine((roles) => new Set(roles).size === roles.length),
  permissions: z.array(z.string().regex(/^[a-z][a-zA-Z]*(?:\.[a-z][a-zA-Z]*)+$/))
    .max(100).refine((permissions) => new Set(permissions).size === permissions.length),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
}).strict().superRefine((claims, context) => {
  if (claims.exp - claims.iat !== ACCESS_TOKEN_TTL_SECONDS) {
    context.addIssue({ code: 'custom', path: ['exp'], message: 'Access tokens must last 15 minutes' });
  }
});
