import 'dotenv/config';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const migrationName = process.argv[2] || process.env.MIGRATION_NAME || 'schema_update';

function run(commandArgs, label) {
  const prismaCliPath = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
  const result = spawnSync(process.execPath, [prismaCliPath, ...commandArgs], {
    stdio: 'inherit',
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const code = result.status ?? 1;
    throw new Error(`${label} failed with exit code ${code}`);
  }
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

function main() {
  console.log(`Running safe Prisma migrate flow with migration name: ${migrationName}`);

  runHealthcheck();
  run(['migrate', 'dev', '--name', migrationName], 'prisma migrate dev');

  console.log('Safe Prisma migrate flow completed successfully.');
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
