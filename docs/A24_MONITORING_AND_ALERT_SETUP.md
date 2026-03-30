# A24 Monitoring and Alert Setup

## Minimum Monitoring Coverage

## 1) Platform Health

- Vercel deployment status notifications enabled.
- API route error logs visible to on-call owner.
- Daily cron execution logs for lifecycle route checked.

## 2) Business-Critical Flows

- Booking creation success vs failure rate.
- Booking reschedule/cancel failure rate.
- MTM funnel event continuity:
  - `gjm_mtm_configurator_start`
  - `gjm_mtm_cart_add`
  - `gjm_mtm_checkout_start`
  - `gjm_mtm_order_completed`

## 3) Alert Thresholds

- High error alert: API 5xx rate above baseline for 10 minutes.
- Deployment failure alert: failed production deployment.
- Cron failure alert: no successful lifecycle cron run in 24 hours.
- Funnel drop alert: `gjm_mtm_checkout_start` to `gjm_mtm_order_completed` falls below baseline.

Reference rule template: `docs/A24_ALERT_RULES_TEMPLATE.md`.

## 4) Verification Commands

- `npm run verify:analytics`
- `npm run qa:launch-readiness`
- `npx ts-node --esm scripts/qa-mtm-admin-prod-smoke.ts`

## 5) Ownership

- Assign primary + secondary on-call contacts.
- Define incident response channel.
- Keep incident notes in the rollback runbook.