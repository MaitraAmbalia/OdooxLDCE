import 'dotenv/config';
import { z } from 'zod';
import path from 'node:path';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/student_organization'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  JSON_BODY_LIMIT: z.string().default('1mb'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  CARD_QR_SECRET: z.string().default('default_demo_qr_card_secret_12345'),
  JWT_ACCESS_SECRET: z.string().min(16).default('default_jwt_access_secret_key_12345_67890'),
  JWT_REFRESH_SECRET: z.string().min(16).default('default_jwt_refresh_secret_key_12345_67890'),
  COLLEGE_EMAIL_DOMAIN: z.string().default('nirmauni.ac.in'),
  FILE_STORAGE_PATH: z.string().default('./storage'),
});

let cachedConfig;

export function loadConfig(source = process.env) {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${result.error.message}`);
  }

  const env = result.data;
  return Object.freeze({
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    collegeEmailDomain: env.COLLEGE_EMAIL_DOMAIN.toLowerCase(),
    fileStoragePath: path.resolve(env.FILE_STORAGE_PATH),
    corsOrigin: env.CORS_ORIGIN,
    logLevel: env.LOG_LEVEL,
    jsonBodyLimit: env.JSON_BODY_LIMIT,
    razorpayKeyId: env.RAZORPAY_KEY_ID,
    razorpayKeySecret: env.RAZORPAY_KEY_SECRET,
    paymentWebhookSecret: env.PAYMENT_WEBHOOK_SECRET,
    cardQrSecret: env.CARD_QR_SECRET,
  });
}

export function getConfig() {
  cachedConfig ??= loadConfig();
  return cachedConfig;
}
