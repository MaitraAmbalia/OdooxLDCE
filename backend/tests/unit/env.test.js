import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config/env.js';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '4000',
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/student_organization',
  CORS_ORIGIN: 'http://localhost:5173',
  TRUST_PROXY: 'false',
  LOG_LEVEL: 'silent',
  JSON_BODY_LIMIT: '1mb',
};

describe('loadConfig', () => {
  it('parses and normalizes a valid environment', () => {
    expect(loadConfig(validEnvironment)).toMatchObject({
      nodeEnv: 'test',
      port: 4000,
      isProduction: false,
      trustProxy: false,
    });
  });

  it('fails fast when required configuration is invalid', () => {
    expect(() =>
      loadConfig({ ...validEnvironment, DATABASE_URL: 'mysql://localhost/example' }),
    ).toThrow(/DATABASE_URL must be a PostgreSQL connection URL/);
  });
});
