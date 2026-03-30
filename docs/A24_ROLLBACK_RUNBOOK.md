# A24 Rollback Runbook

Use this when production behavior regresses after deployment.

## Trigger Conditions

- Sustained 5xx errors on critical customer/admin routes.
- Booking creation/reschedule failure spike.
- Checkout handoff breakage.
- Authentication/session breakage.

## Immediate Actions (First 10 Minutes)

1. Freeze further deployments.
2. Identify last known good deployment in Vercel.
3. Roll back alias to last known good deployment.
4. Re-run smoke checks:
   - `/admin/bookings`
   - `/admin/appointments`
   - `/admin/mtm-orders`
   - MTM detail/spec smoke script

## Validation After Rollback

- Confirm route statuses are healthy.
- Confirm booking APIs return expected responses.
- Confirm auth session endpoint behavior.
- Confirm analytics ingestion is functioning.

## Root Cause Follow-up

1. Capture failing commit SHA and deployment id.
2. Capture error logs and affected routes.
3. Write corrective patch in branch.
4. Re-run `npm run qa:predeploy:strict` and `npm run qa:launch-readiness`.
5. Redeploy with controlled verification.