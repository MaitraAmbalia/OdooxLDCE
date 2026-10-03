import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prismaCli = require.resolve('prisma/build/index.js');
const [action, ...extra] = process.argv.slice(2);
const commands = { validate: ['validate'], format: ['format'], generate: ['generate'], deploy: ['migrate', 'deploy'] };
if (!Object.hasOwn(commands, action)) throw new Error('Use validate, format, generate or deploy');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
for (const context of ['platform', 'commerce', 'people']) {
  const variable = `${context.toUpperCase()}_DATABASE_URL`;
  const url = new URL(process.env[variable] ?? process.env.DATABASE_URL);
  if (process.env[variable] && url.searchParams.get('schema') !== context) throw new Error(`${variable} must select schema=${context}`);
  url.searchParams.set('schema', context);
  process.env[variable] = url.toString();
  const result = spawnSync(process.execPath, [prismaCli, ...commands[action], '--schema', `prisma/${context}/schema.prisma`, ...extra], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
