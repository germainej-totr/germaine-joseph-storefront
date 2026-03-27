import 'dotenv/config';
import dns from 'node:dns/promises';
import net from 'node:net';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const retries = Number.parseInt(process.env.PRISMA_HEALTH_RETRIES || '3', 10);
const retryDelayMs = Number.parseInt(process.env.PRISMA_HEALTH_RETRY_DELAY_MS || '1500', 10);
const tcpTimeoutMs = Number.parseInt(process.env.PRISMA_HEALTH_TCP_TIMEOUT_MS || '5000', 10);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDatabaseTarget() {
  const url = process.env.DATABASE_URL || '';
  if (!url) {
    throw new Error('DATABASE_URL is missing');
  }

  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || '5432'),
    protocol: parsed.protocol,
  };
}

async function checkDns(host) {
  const records = await dns.lookup(host, { all: true });
  if (!records.length) {
    throw new Error(`DNS lookup returned no records for ${host}`);
  }
}

function checkTcp(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const cleanup = () => {
      socket.removeAllListeners();
      socket.destroy();
    };

    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(true);
    });

    socket.once('timeout', () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`TCP timeout after ${timeoutMs}ms to ${host}:${port}`));
    });

    socket.once('error', (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    });

    socket.connect(port, host);
  });
}

function checkPrismaExecute() {
  const prismaCliPath = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
  const result = spawnSync(
    process.execPath,
    [prismaCliPath, 'db', 'execute', '--stdin', '--schema', 'prisma/schema.prisma'],
    {
      input: 'SELECT 1;',
      encoding: 'utf8',
      env: process.env,
    },
  );

  if (result.status !== 0) {
    if (result.error) {
      throw new Error(`prisma db execute failed: ${result.error.message}`);
    }
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    const details = stderr || stdout || `exit code ${result.status}`;
    throw new Error(`prisma db execute failed: ${details}`);
  }
}

async function runWithRetries(label, fn) {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await fn();
      console.log(`[ok] ${label} (attempt ${attempt}/${retries})`);
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[retry] ${label} failed (attempt ${attempt}/${retries}): ${message}`);
      if (attempt < retries) {
        await sleep(retryDelayMs);
      }
    }
  }

  throw lastError || new Error(`${label} failed`);
}

async function main() {
  const { host, port, protocol } = getDatabaseTarget();

  console.log(`Prisma DB target: ${host}:${port} (${protocol})`);
  console.log(`Retries: ${retries}, delay: ${retryDelayMs}ms, tcp timeout: ${tcpTimeoutMs}ms`);

  await runWithRetries('DNS lookup', () => checkDns(host));
  await runWithRetries('TCP connectivity', () => checkTcp(host, port, tcpTimeoutMs));
  await runWithRetries('Prisma db execute', () => Promise.resolve(checkPrismaExecute()));

  console.log('Prisma connectivity healthcheck passed.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Prisma connectivity healthcheck failed: ${message}`);
  process.exit(1);
});
