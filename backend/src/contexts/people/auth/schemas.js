import { z } from 'zod';
import { termRoleSchema } from '../../../platform/auth/claims.js';

export const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
const password = z.string().min(10).max(128);
const phone = z.string().regex(/^\+[1-9]\d{7,14}$/);
const token = z.string().regex(/^[a-zA-Z0-9_-]{43}$/);
export const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email, password,
  studentId: z.string().trim().min(1).max(40), phone: phone.optional(), newsletterOptIn: z.boolean().default(false) });
export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
export const emailSchema = z.object({ email });
export const verifySchema = z.union([z.object({ token }), z.object({ email, code: z.string().regex(/^\d{6}$/) })]);
export const resetSchema = z.object({ token, newPassword: password });
export const profileSchema = z.object({ name: z.string().trim().min(2).max(80).optional(),
  phone: phone.nullable().optional(), avatarFileId: z.uuid().nullable().optional() }).refine((value) => Object.keys(value).length > 0);
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: password });
export const idParams = z.object({ id: z.uuid() });
export const pageSchema = z.object({ page: z.coerce.number().int().min(1).max(1000000).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
export const directorySchema = pageSchema.extend({ q: z.string().max(80).optional(),
  role: termRoleSchema.optional(), membershipStatus: z.enum(['ACTIVE', 'LAPSED', 'PENDING', 'NONE']).optional(),
  isVolunteer: z.enum(['true', 'false']).transform((value) => value === 'true').optional() });
export const disabledSchema = z.object({ isDisabled: z.boolean(), reason: z.string().trim().min(3).max(500) });
export const assignmentSchema = z.object({ userId: z.uuid(), role: termRoleSchema.exclude(['MENTOR']),
  termStart: z.iso.datetime({ offset: true }), termEnd: z.iso.datetime({ offset: true }), reason: z.string().trim().min(3).max(500) })
  .refine((value) => new Date(value.termEnd) > new Date(value.termStart), { path: ['termEnd'], message: 'Term end must follow start' });
export const endSchema = z.object({ reason: z.string().trim().min(3).max(500) });
export const assignmentQuery = pageSchema.extend({ active: z.enum(['true', 'false']).transform((value) => value === 'true').default(true),
  role: termRoleSchema.optional(), userId: z.uuid().optional() });
export const newsletterTokenSchema = z.object({ token });
