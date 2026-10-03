import 'dotenv/config';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

const developmentAccessSecret = randomBytes(32).toString('hex');
const developmentRefreshSecret = randomBytes(32).toString('hex');

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
  // Secret that signs membership card QR codes.
  CARD_QR_SECRET: z.string().min(16).optional(),
  PEOPLE_DATABASE_URL: z.string().url().optional(),
  PLATFORM_DATABASE_URL: z.string().url().optional(),
  COMMERCE_DATABASE_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.preprocess((value) => value || undefined, z.string().min(32).optional()),
  JWT_REFRESH_SECRET: z.preprocess((value) => value || undefined, z.string().min(32).optional()),
  COLLEGE_EMAIL_DOMAIN: z.string().regex(/^[a-zA-Z0-9.-]+$/).default('nirmauni.ac.in'),
  APP_TIMEZONE: z.string().default('Asia/Kolkata'),
  FILE_STORAGE: z.enum(['local', 's3']).default('local'),
  FILE_STORAGE_PATH: z.string().default('./storage'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  SMTP_HOST: z.string().default('127.0.0.1'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Skyline <no-reply@nirmauni.ac.in>'),
}).superRefine((env, context) => {
  if (env.NODE_ENV === 'production' && (!env.JWT_ACCESS_SECRET || !env.JWT_REFRESH_SECRET)) {
    context.addIssue({ code: 'custom', message: 'Production requires distinct JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (32+ characters)' });
  }
  if (env.JWT_ACCESS_SECRET && env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    context.addIssue({ code: 'custom', message: 'Access and refresh secrets must be distinct' });
  }
  if (env.FILE_STORAGE === 's3' && (!env.S3_BUCKET || !env.S3_REGION)) {
    context.addIssue({ code: 'custom', message: 'S3 storage requires S3_BUCKET and S3_REGION' });
  }
});

function contextUrl(base, explicit, schema) {
  const url = new URL(explicit ?? base);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Context database URLs must use PostgreSQL');
  if (explicit && url.searchParams.get('schema') !== schema) throw new Error(`Database URL must use schema=${schema}`);
  url.searchParams.set('schema', schema);
  return url.toString();
}

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
    peopleDatabaseUrl: contextUrl(env.DATABASE_URL, env.PEOPLE_DATABASE_URL, 'people'),
    platformDatabaseUrl: contextUrl(env.DATABASE_URL, env.PLATFORM_DATABASE_URL, 'platform'),
    commerceDatabaseUrl: contextUrl(env.DATABASE_URL, env.COMMERCE_DATABASE_URL, 'commerce'),
    accessSecret: env.JWT_ACCESS_SECRET ?? developmentAccessSecret,
    refreshSecret: env.JWT_REFRESH_SECRET ?? developmentRefreshSecret,
    collegeEmailDomain: env.COLLEGE_EMAIL_DOMAIN.toLowerCase(),
    timezone: env.APP_TIMEZONE,
    fileStorage: env.FILE_STORAGE,
    fileStoragePath: path.resolve(env.FILE_STORAGE_PATH),
    s3Bucket: env.S3_BUCKET,
    s3Region: env.S3_REGION,
    smtp: { host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465,
      connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 8000,
      ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } } : {}) },
    mailFrom: env.MAIL_FROM,
    corsOrigin: env.CORS_ORIGIN,
    trustProxy: env.TRUST_PROXY,
    logLevel: env.LOG_LEVEL,
    jsonBodyLimit: env.JSON_BODY_LIMIT,
    razorpayKeyId: env.RAZORPAY_KEY_ID,
    razorpayKeySecret: env.RAZORPAY_KEY_SECRET,
    paymentWebhookSecret: env.PAYMENT_WEBHOOK_SECRET,
    cardQrSecret: env.CARD_QR_SECRET,
  });
}

let cachedConfig;

export function getConfig() {
  cachedConfig ??= loadConfig();
  return cachedConfig;
}
