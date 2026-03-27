import 'dotenv/config';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const jsonMode = args.has('--json');

const guidance = [
  'Use: npm run db:migrate:safe -- <descriptive_name>',
  'Avoid reusing init migration names ("init", "0_init").',
  'Do not run: prisma migrate resolve --applied 0_init in normal development.',
  'If migrate status is healthy and schema is in sync, no action is required.',
];

function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function run(commandArgs, label, { allowFailure = false } = {}) {
  const prismaCliPath = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
  const stdio = jsonMode ? 'pipe' : 'inherit';
  const result = spawnSync(process.execPath, [prismaCliPath, ...commandArgs], {
    stdio,
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0 && !allowFailure) {
    const code = result.status ?? 1;
    throw new Error(`${label} failed with exit code ${code}`);
  }

  return {
    exitCode: result.status ?? 0,
    stdout: trimText(result.stdout),
    stderr: trimText(result.stderr),
  };
}

function runHealthcheck() {
  const healthcheckPath = path.join(process.cwd(), 'scripts', 'qa-prisma-connectivity.mjs');
  const stdio = jsonMode ? 'pipe' : 'inherit';
  const result = spawnSync(process.execPath, [healthcheckPath], {
    stdio,
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const code = result.status ?? 1;
    throw new Error(`Prisma connectivity healthcheck failed with exit code ${code}`);
  }

  return {
    exitCode: result.status ?? 0,
    stdout: trimText(result.stdout),
    stderr: trimText(result.stderr),
  };
}

function printGuidanceHuman() {
  console.log('--- Prisma migration doctor guidance ---');
  guidance.forEach((line, index) => {
    console.log(`${index + 1}) ${line}`);
  });
}

function main() {
  if (!jsonMode) {
    console.log('Running Prisma migration doctor...');
  }

  const healthcheck = runHealthcheck();
  const migrateStatus = run(['migrate', 'status'], 'prisma migrate status', { allowFailure: true });

  const report = {
    ok: healthcheck.exitCode === 0 && migrateStatus.exitCode === 0,
    generatedAt: new Date().toISOString(),
    checks: {
      connectivity: {
        ok: healthcheck.exitCode === 0,
        exitCode: healthcheck.exitCode,
        stdout: healthcheck.stdout,
        stderr: healthcheck.stderr,
      },
      migrateStatus: {
        ok: migrateStatus.exitCode === 0,
        exitCode: migrateStatus.exitCode,
        stdout: migrateStatus.stdout,
        stderr: migrateStatus.stderr,
      },
    },
    guidance,
  };

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printGuidanceHuman();
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (jsonMode) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          generatedAt: new Date().toISOString(),
          error: message,
          guidance,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  console.error(message);
  process.exit(1);
}
