import 'dotenv/config';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function run(commandArgs, label, { allowFailure = false } = {}) {
  const prismaCliPath = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
  const result = spawnSync(process.execPath, [prismaCliPath, ...commandArgs], {
    stdio: 'inherit',
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0 && !allowFailure) {
    const code = result.status ?? 1;
    throw new Error(`${label} failed with exit code ${code}`);
  }

  return result.status ?? 0;
}

function runHealthcheck() {
  const healthcheckPath = path.join(process.cwd(), 'scripts', 'qa-prisma-connectivity.mjs');
  const result = spawnSync(process.execPath, [healthcheckPath], {
    stdio: 'inherit',
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const code = result.status ?? 1;
    throw new Error(`Prisma connectivity healthcheck failed with exit code ${code}`);
  }
}

function printGuidance() {
  console.log('--- Prisma migration doctor guidance ---');
  console.log('1) Use: npm run db:migrate:safe -- <descriptive_name>');
  console.log('2) Avoid reusing init migration names ("init", "0_init").');
  console.log('3) Do not run: prisma migrate resolve --applied 0_init in normal development.');
  console.log('4) If migrate status is healthy and schema is in sync, no action is required.');
}

function main() {
  console.log('Running Prisma migration doctor...');

  runHealthcheck();
  run(['migrate', 'status'], 'prisma migrate status', { allowFailure: true });

  printGuidance();
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
