# Lifecycle Automation Setup

## Overview

This document explains how to deploy and configure the **lifecycle automation** system for sending refit reminders to customers with stale fit profiles (6+ months old).

## Architecture

**Cron Job Flow:**
```
Vercel Cron (daily 9 AM UTC)
  ↓
POST /api/automation/lifecycle-reminder-cron
  ↓
Query stale profiles (FitProfile.updatedAt < 6 months)
  ↓
For each profile:
  - Render refit reminder email (RefitReminderEmail.tsx)
  - Send via Resend
  - Post lifecycle event to PostHog (fit_check_reminder_sent)
  ↓
Return summary (success count, emails sent)
```

## Setup Steps

### 1. Generate Cron Secret (Security)

Generate a random secret to prevent unauthorized cron invocations:

```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([byte[]][System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(32))
```

Example output: `aBcD1EfGhIjKlMnOpQrStUvWxYz2abc3def45gHi6jK=`

### 2. Add to Vercel Environment Variables

1. Go to **Vercel Dashboard** → Project → **Settings** → **Environment Variables**
2. Add new variable:
   - **Name:** `VERCEL_CRON_SECRET`
   - **Value:** (paste the secret from step 1)
   - **Scope:** Select both `Preview` and `Production`
3. Click **Save**

### 3. Deploy

The cron configuration is already in `vercel.json`:

```json
{
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/automation/lifecycle-reminder-cron",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This schedule runs **daily at 9 AM UTC** (Monday–Sunday).

When you push to GitHub, Vercel will:
1. Detect the changes
2. Deploy the app
3. Register the cron schedule automatically

### 4. Verify Deployment

After deployment, check Vercel to confirm the cron is active:

1. Go to **Vercel Dashboard** → Project → **Cron Jobs** (new tab under Deployments)
2. You should see: `/api/automation/lifecycle-reminder-cron` with status **Active**
3. Next execution time is shown (usually within 24 hours of deployment)

### 5. Manual Testing

To test locally before relying on the cron:

```bash
# Get your VERCEL_CRON_SECRET
echo $VERCEL_CRON_SECRET

# Call the endpoint manually
curl -X POST \
  -H "x-vercel-cron-secret: YOUR_VERCEL_CRON_SECRET" \
  https://your-staging-url.vercel.app/api/automation/lifecycle-reminder-cron
```

Expected response:
```json
{
  "ok": true,
  "message": "Sent 5/5 refit reminders",
  "profilesProcessed": 5,
  "emailsSent": 5
}
```

## Monitoring

### PostHog Events

Each cron run posts `fit_check_reminder_sent` events to PostHog. View them:

1. Go to **PostHog** → **Events**
2. Search for: `fit_check_reminder_sent`
3. Filter by `campaign_id: lifestyle-reminder-*` to track by run

### Email Delivery (Resend)

1. Go to **Resend Dashboard** → **Emails**
2. Search for "Your Fit Refresh Is Ready" subject line
3. Verify delivery status and click rates

## Troubleshooting

### Cron not running?

1. **Check Vercel Cron Status:**
   - Vercel Dashboard → Project → Cron Jobs
   - Is it showing as **Active**?
   - Check "Recent Invocations" tab for errors

2. **Missing environment variables?**
   - Confirm `VERCEL_CRON_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL` are set in Vercel
   - Production cron jobs can't access `.env.local` — must use Vercel UI

3. **No profiles found?**
   - Check database: do FitProfile records have `updatedAt` > 6 months old?
   - Confirm `customerId` and `email` fields are populated (required for reminders)

### Emails not sending?

1. Check Resend logs: https://resend.com/emails
2. Verify `RESEND_API_KEY` is correct
3. Check `RESEND_FROM` format: must be `"Name <email@domain>"`

## Configuration Tuning

Edit thresholds in `lib/automation/staleProfileQuery.ts`:

```typescript
export const LIFECYCLE_CONFIG = {
  STALE_PROFILE_DAYS: 180,           // Change 6-month threshold
  PREVIEW_REMINDER_DAYS: 30,         // Warning window (remind 1 month before)
  MAX_REMINDERS_PER_RUN: 100,        // Limit batch size
  EXCLUDE_RECENT_INTERACTIONS: 7,    // Don't remind if active in past N days
};
```

## Cron Schedule Reference

Current schedule: `0 9 * * *` (9 AM UTC daily)

To change:
1. Edit `vercel.json`: update the `schedule` field
2. Redeploy: `git push`
3. Vercel auto-updates the schedule

Other examples:
- `0 0 * * *` — Midnight UTC daily
- `0 9 * * MON` — 9 AM UTC on Mondays only
- `0 9 1 * *` — 9 AM UTC on 1st of each month

See [Cron Expression Format](https://vercel.com/docs/cron-jobs) for details.

## Next Steps

1. **Add campaign tracking:** Store which profiles received reminders (add `lastReminderSentAt` to FitProfile schema)
2. **A/B test email copy:** Create variants and track click rates in PostHog
3. **Refit completion tracking:** Post `refit_reactivation_accepted` when user completes fit form after reminder
4. **SMS/SMS hybrid:** Complement email with SMS reminders for higher engagement
