# A24 Launch Checklist

Use this on go-live day.

## Pre-Launch (T-60 to T-15)

- Confirm production deployment is green in Vercel.
- Confirm `npm run qa:launch-readiness` passes against production config.
- Confirm admin routes return 200:
  - `/admin/bookings`
  - `/admin/appointments`
  - `/admin/mtm-orders`
- Confirm MTM detail/spec smoke on production passes.

## Launch Window (T-15 to T+15)

- Announce launch start in operations channel.
- Trigger deployment of approved commit only.
- Confirm customer auth start and callback routes work.
- Confirm booking confirmation and reschedule email delivery.
- Confirm one order webhook path writes `ProductionSpec` successfully.

## Post-Launch (T+15 to T+120)

- Watch API error rate and failed route logs.
- Watch MTM funnel events for data flow continuity.
- Watch lifecycle cron invocation logs for first scheduled run.
- Record launch outcome and any incidents in runbook.