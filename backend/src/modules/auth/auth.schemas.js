import { z } from 'zod';
import { termRoleSchema } from '../../utils/jwt.js';

export const email = z.string().trim().toLowerCase().pipe(z.string().email().max(254));
const password = z.string().min(8).max(128);
const phone = z.string().regex(/^\+?[1-9]\d{7,14}$/).optional();
const token = z.string().min(20).max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password,
  studentId: z.string().trim().min(1).max(40),
  phone: phone.optional(),
  newsletterOptIn: z.boolean().default(false),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const emailSchema = z.object({ email });

export const verifySchema = z.union([
  z.object({ token }),
  z.object({ email, code: z.string().regex(/^\d{6}$/) }),
]);

export const resetSchema = z.object({
  token,
  newPassword: password,
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phone.nullable().optional(),
  avatarFileId: z.string().uuid().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0);

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password,
});

export const idParams = z.object({ id: z.string().uuid() });
