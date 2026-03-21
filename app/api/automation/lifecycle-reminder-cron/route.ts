import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import RefitReminderEmail from '@/components/emails/RefitReminderEmail';
import { findStaleProfiles, calculateProfileAgeDays } from '@/lib/automation/staleProfileQuery';
import type { LifecycleEventPayload } from '@/lib/analytics/lifecycleEventContract';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/automation/lifecycle-reminder-cron
 *
 * Cron job to send refit reminders to customers with stale fit profiles (6+ months).
 * Can be triggered manually or by Vercel Cron (see vercel.json).
 *
 * Security: Require X-Vercel-Cron-Secret header to prevent unauthorized invocations.
 */
export async function POST(request: Request) {
  const cronSecret = request.headers.get('x-vercel-cron-secret');
  const expectedSecret = process.env.VERCEL_CRON_SECRET;

  // Verify cron secret if configured
  if (expectedSecret && cronSecret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    // Find stale fit profiles (updated 6+ months ago, or approaching that threshold)
    const staleProfiles = await findStaleProfiles({ limit: 50 });

    if (!staleProfiles.length) {
      return NextResponse.json({
        ok: true,
        message: 'No stale profiles found',
        profilesProcessed: 0,
        emailsSent: 0,
      });
    }

    // Send reminders and track events
    const results = await Promise.all(
      staleProfiles.map(async (profile) => {
        const ageDays = calculateProfileAgeDays(profile.updatedAt);

        try {
          // Render email
          const emailHtml = render(
            <RefitReminderEmail
              customerName={profile.profile_name || 'Valued Customer'}
              lastFitDate={profile.updatedAt}
              estimatedDaysSinceFit={ageDays}
              reengagementLink={`${process.env.NEXT_PUBLIC_APP_URL}/fit/smart?campaign=refit-reminder&profile=${profile.id}`}
            />,
          );

          // Send via Resend
          const sendResult = await resend.emails.send({
            from: process.env.RESEND_FROM || 'Germaine Joseph <noreply@germainejoseph.com>',
            to: profile.email!,
            subject: 'Your Fit Refresh Is Ready — Updated Measurements',
            html: emailHtml,
          });

          // Track lifecycle event
          const lifecycleEvent: LifecycleEventPayload = {
            event_name: 'fit_check_reminder_sent',
            occurred_at: new Date().toISOString(),
            customer_id: profile.customerId!,
            fit_profile_id: profile.id,
            campaign_id: `lifecycle-reminder-${new Date().toISOString().split('T')[0]}`,
            profile_age_days: ageDays,
            trigger_reason: 'passed_6_month_threshold',
          };

          // Post to analytics (fire and forget)
          fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analytics/mtm-gate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lifecycleEvent),
            keepalive: true,
          }).catch((err) => console.error('Analytics event failed:', err));

          return {
            success: sendResult.id ? true : false,
            profileId: profile.id,
            email: profile.email,
            ageDays,
            emailId: sendResult.id,
            error: sendResult.error?.message,
          };
        } catch (error) {
          return {
            success: false,
            profileId: profile.id,
            email: profile.email,
            ageDays,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }),
    );

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      ok: true,
      message: `Sent ${successCount}/${results.length} refit reminders`,
      profilesProcessed: results.length,
      emailsSent: successCount,
      results: process.env.NODE_ENV === 'development' ? results : undefined, // Debug in dev only
    });
  } catch (error) {
    console.error('Lifecycle cron error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Cron job failed',
      },
      { status: 500 },
    );
  }
}

/**
 * GET handler for manual testing/verification
 * Allows triggers like: curl -H "x-vercel-cron-secret: YOUR_SECRET" https://your-app.com/api/automation/lifecycle-reminder-cron
 */
export async function GET(request: Request) {
  // Only allow GET in development for ease of testing
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, error: 'Use POST only in production' }, { status: 405 });
  }

  // Reuse POST logic
  return POST(request);
}
