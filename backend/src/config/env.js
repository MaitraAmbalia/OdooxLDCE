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
  // Razorpay test keys. Optional at boot; payment calls answer 503 until they are set.
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
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
    razorpayKeyId: env.RAZORPAY_KEY_ID,
    razorpayKeySecret: env.RAZORPAY_KEY_SECRET,
    paymentWebhookSecret: env.PAYMENT_WEBHOOK_SECRET,
  });
}

let cachedConfig;

export function getConfig() {
  cachedConfig ??= loadConfig();
  return cachedConfig;
}
