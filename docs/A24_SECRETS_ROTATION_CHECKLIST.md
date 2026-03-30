# A24 Secrets Rotation Checklist

Rotate secrets before launch and after any security event.

## Scope

- Vercel project env vars (preview + production separately)
- Shopify admin/storefront tokens
- App session signing secret
- Resend API key
- PostHog ingestion keys
- Klaviyo private key (if enabled)

## Rotation Steps

1. Create new credential in upstream provider.
2. Add new value to preview first and validate.
3. Promote to production during low-risk window.
4. Redeploy production.
5. Run `npm run qa:launch-readiness`.
6. Validate key flows:
   - customer auth
   - booking confirm/reschedule emails
   - MTM cart/order analytics events
   - lifecycle cron auth and dry-run
7. Revoke old credential.

## Required Post-Rotation Checks

- No auth/session failures in logs.
- No 401/403 spikes from Shopify APIs.
- No email provider authorization failures.
- PostHog event ingestion still active.
- Klaviyo event endpoint responses remain successful when enabled.