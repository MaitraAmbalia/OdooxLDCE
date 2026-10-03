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
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('Skyline Club <noreply@skyline.nirmauni.ac.in>'),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  ODOO_ENABLED: z.enum(['true', 'false']).default('false'),
  ODOO_URL: z.string().url().default('http://127.0.0.1:8069'),
  ODOO_WEB_URL: z.string().url().optional(),
  ODOO_DATABASE: z.string().default('skyline_odoo'),
  ODOO_USERNAME: z.string().default('integration@skyline.local'),
  ODOO_PASSWORD: z.string().default(''),
  ODOO_TIMEOUT_MS: z.coerce.number().int().min(500).max(30000).default(5000),
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
    smtpHost: env.SMTP_HOST,
    smtpPort: env.SMTP_PORT,
    smtpUser: env.SMTP_USER,
    smtpPass: env.SMTP_PASS,
    smtpFrom: env.SMTP_FROM,
    smtpSecure: env.SMTP_SECURE === 'true',
    cardQrSecret: env.CARD_QR_SECRET,
    odooEnabled: env.ODOO_ENABLED === 'true',
    odooUrl: env.ODOO_URL.replace(/\/$/, ''),
    odooWebUrl: (env.ODOO_WEB_URL || env.ODOO_URL).replace(/\/$/, ''),
    odooDatabase: env.ODOO_DATABASE,
    odooUsername: env.ODOO_USERNAME,
    odooPassword: env.ODOO_PASSWORD,
    odooTimeoutMs: env.ODOO_TIMEOUT_MS,
  });
}

export function getConfig() {
  cachedConfig ??= loadConfig();
  return cachedConfig;
}
