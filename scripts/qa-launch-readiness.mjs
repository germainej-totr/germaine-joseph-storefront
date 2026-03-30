import fs from 'node:fs';

const baseUrl = (process.env.LAUNCH_BASE_URL || process.env.RUNTIME_BASE_URL || '').replace(/\/$/, '');
const allowMissingEnv = process.env.LAUNCH_ALLOW_MISSING_ENV === 'true';
const bypassToken = process.env.RUNTIME_BYPASS_TOKEN || process.env.VERCEL_BYPASS_TOKEN || '';

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'APP_SESSION_SECRET',
  'SHOPIFY_STORE_DOMAIN',
  'SHOPIFY_ADMIN_ACCESS_TOKEN',
  'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN',
  'NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN',
  'RESEND_API_KEY',
  'RESEND_FROM',
  'POSTHOG_API_KEY',
  'POSTHOG_PROJECT_API_KEY',
  'VERCEL_CRON_SECRET',
];

const OPTIONAL_ENV_VARS = [
  'KLAVIYO_BOOKING_EVENTS_ENABLED',
  'KLAVIYO_LIFECYCLE_EVENTS_ENABLED',
  'KLAVIYO_GJ_PRIVATE_API_KEY',
  'KLAVIYO_ACCOUNT_LABEL',
  'SHOPIFY_CUSTOMER_ACCOUNT_AUTHORIZE_URL',
  'SHOPIFY_CUSTOMER_ACCOUNT_TOKEN_URL',
  'SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID',
  'SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET',
  'SHOPIFY_CUSTOMER_ACCOUNT_API_URL',
];

const ROUTE_CHECKS = [
  { path: '/admin/bookings', statuses: [200] },
  { path: '/admin/appointments', statuses: [200] },
  { path: '/admin/mtm-orders', statuses: [200] },
  { path: '/api/auth/session', statuses: [200, 401] },
  { path: '/api/fit/gate-status', statuses: [200, 401] },
];

function hasValue(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function checkVercelCronConfig() {
  const vercelConfigRaw = fs.readFileSync('vercel.json', 'utf8');
  const vercelConfig = JSON.parse(vercelConfigRaw);
  const cronEntries = Array.isArray(vercelConfig.crons) ? vercelConfig.crons : [];
  const lifecycleCron = cronEntries.find(
    (entry) => entry?.path === '/api/automation/lifecycle-reminder-cron',
  );

  assert(lifecycleCron, 'vercel.json missing lifecycle cron path');
  assert(
    lifecycleCron.schedule === '0 9 * * *',
    `lifecycle cron schedule should be 0 9 * * * for Hobby compatibility, got ${lifecycleCron.schedule}`,
  );
}

async function checkRoutes() {
  if (!baseUrl) {
    console.log('SKIP route checks -> LAUNCH_BASE_URL/RUNTIME_BASE_URL not set');
    return;
  }

  for (const route of ROUTE_CHECKS) {
    const headers = new Headers();
    if (bypassToken) {
      headers.set('x-vercel-protection-bypass', bypassToken);
      headers.set('x-vercel-set-bypass-cookie', 'true');
    }

    const response = await fetch(`${baseUrl}${route.path}`, {
      method: 'GET',
      redirect: 'manual',
      headers,
    });

    assert(
      route.statuses.includes(response.status),
      `${route.path} expected [${route.statuses.join(', ')}], got ${response.status}`,
    );
    console.log(`OK route ${route.path} (${response.status})`);
  }
}

function checkEnv() {
  const missingRequired = REQUIRED_ENV_VARS.filter((name) => !hasValue(name));
  const missingOptional = OPTIONAL_ENV_VARS.filter((name) => !hasValue(name));

  if (missingRequired.length) {
    console.log(`Missing required env vars (${missingRequired.length}):`);
    for (const key of missingRequired) {
      console.log(`- ${key}`);
    }
    if (!allowMissingEnv) {
      throw new Error('required env vars missing');
    }
  }

  if (missingOptional.length) {
    console.log(`Missing optional env vars (${missingOptional.length}):`);
    for (const key of missingOptional) {
      console.log(`- ${key}`);
    }
  }

  const hasAllRequired = missingRequired.length === 0;
  if (hasAllRequired) {
    console.log('OK env required set complete');
  }
}

async function main() {
  console.log('A24 launch readiness check starting');
  checkEnv();
  checkVercelCronConfig();
  console.log('OK vercel cron config');
  await checkRoutes();
  console.log('A24 launch readiness check passed');
}

main().catch((error) => {
  console.error(`A24 launch readiness check failed: ${error.message}`);
  process.exitCode = 1;
});