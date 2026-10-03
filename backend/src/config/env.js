import 'dotenv/config';
import { z } from 'zod';

const trustProxySchema = z
  .union([z.boolean(), z.string()])
  .default(false)
  .transform((value, context) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;

    const hops = Number(value);
    if (Number.isInteger(hops) && hops >= 0) return hops;

    context.addIssue({
      code: 'custom',
      message: 'TRUST_PROXY must be true, false, or a non-negative integer',
    });
    return z.NEVER;
  });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((value) => /^postgres(ql)?:\/\//.test(value), {
      message: 'DATABASE_URL must be a PostgreSQL connection URL',
    }),
  CORS_ORIGIN: z.string().url(),
  TRUST_PROXY: trustProxySchema,
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  JSON_BODY_LIMIT: z.string().min(1).default('1mb'),
  // Payments (Module 1). MOCK needs no keys; RAZORPAY needs all three (checked below).
  PAYMENT_PROVIDER: z.enum(['MOCK', 'RAZORPAY']).default('MOCK'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
}).superRefine((env, ctx) => {
  if (env.PAYMENT_PROVIDER !== 'RAZORPAY') return;
  for (const key of ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'PAYMENT_WEBHOOK_SECRET']) {
    if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required when PAYMENT_PROVIDER=RAZORPAY` });
  }
});

function formatIssues(issues) {
  return issues
    .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('; ');
}

export function loadConfig(source = process.env) {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${formatIssues(result.error.issues)}`);
  }

  const env = result.data;

  return Object.freeze({
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    corsOrigin: env.CORS_ORIGIN,
    trustProxy: env.TRUST_PROXY,
    logLevel: env.LOG_LEVEL,
    jsonBodyLimit: env.JSON_BODY_LIMIT,
    paymentProvider: env.PAYMENT_PROVIDER,
    razorpayKeyId: env.RAZORPAY_KEY_ID,
    razorpayKeySecret: env.RAZORPAY_KEY_SECRET,
    // MOCK falls back to a fixed dev secret so the webhook path is exercised the same way.
    paymentWebhookSecret: env.PAYMENT_WEBHOOK_SECRET ?? 'dev-mock-webhook-secret',
  });
}

let cachedConfig;

export function getConfig() {
  cachedConfig ??= loadConfig();
  return cachedConfig;
}
