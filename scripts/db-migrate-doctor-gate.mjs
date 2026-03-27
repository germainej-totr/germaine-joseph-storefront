import path from 'node:path';
import { spawnSync } from 'node:child_process';

function parseJsonFromOutput(output) {
  const trimmed = String(output || '').trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    // Fallback: attempt to parse a JSON object embedded in noisy output.
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace < 0 || lastBrace <= firstBrace) return null;

    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
}

function main() {
  const doctorPath = path.join(process.cwd(), 'scripts', 'db-migrate-doctor.mjs');
  const result = spawnSync(process.execPath, [doctorPath, '--json'], {
    encoding: 'utf8',
    env: process.env,
    stdio: 'pipe',
  });

  const combinedOutput = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  const report = parseJsonFromOutput(combinedOutput);

  if (!report || typeof report !== 'object') {
    console.error('Failed to parse db:migrate:doctor JSON output.');
    if (combinedOutput) {
      console.error(combinedOutput);
    }
    process.exit(1);
  }

  const ok = report.ok === true;
  if (!ok) {
    console.error('Prisma migration doctor gate failed (ok=false).');
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  console.log('Prisma migration doctor gate passed.');
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
