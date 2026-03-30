# A24 Pre-Production Checklist

Use this before promoting a branch to production.

## 1) Code and Build Gate

- Run `npm run qa:predeploy:strict`.
- Confirm no TypeScript errors (`npx tsc --noEmit`).
- Confirm latest deployment includes expected commit SHA.

## 2) Environment Separation

- Verify production and preview use different secret values.
- Verify production domain and preview domain are not mixed.
- Verify `vercel.json` cron schedule remains `0 9 * * *` on Hobby.

## 3) Runtime Readiness

- Run `npm run qa:launch-readiness` with production env loaded.
- Run `npm run qa:mtm-ui-checklist` for customer path sanity.
- Run `npx ts-node --esm scripts/qa-mtm-admin-prod-smoke.ts`.

## 4) Data and Automation

- Confirm Prisma connectivity (`npm run qa:prisma-connectivity`).
- Confirm lifecycle cron route secret is present (`VERCEL_CRON_SECRET`).
- Run lifecycle dry-run once pre-release:
  - `POST /api/automation/lifecycle-reminder-cron?dryRun=true` with cron auth.

## 5) Analytics and Monitoring Baseline

- Confirm analytics events are ingesting (`npm run verify:analytics`).
- Confirm dashboards are seeded (`npm run seed:posthog-dashboards`).
- Confirm error tracking dashboard and alert channel are reachable.