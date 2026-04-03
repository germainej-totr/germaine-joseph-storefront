import { spawnSync } from 'node:child_process';

const stagingBaseUrl = process.env.STAGING_BASE_URL;

if (!stagingBaseUrl) {
  console.log('Skipping MTM funnel category smoke: STAGING_BASE_URL is not set.');
  process.exit(0);
}

console.log(`Running MTM funnel category smoke against ${stagingBaseUrl}`);

const result = spawnSync(
  process.execPath,
  ['scripts/posthog/staging-mtm-funnel-category-smoke.mjs'],
  {
    stdio: 'inherit',
    env: process.env,
  },
);

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
