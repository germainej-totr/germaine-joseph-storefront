import { NextResponse } from 'next/server';
import {
  listSavedFitReactivationCandidates,
  listRefitReminderCandidates,
  listPreEventBookingReminderCandidates,
  listPostEventFollowupCandidates,
  markSavedFitReactivationSent,
  markRefitReminderSent,
  markBookingPreEventReminderSent,
  markBookingPostEventFollowupSent,
  readBookingLocationAddress,
  toDateAndTimeSlot,
  DEFAULT_LIFECYCLE_AUTOMATION_CONFIG,
} from '@/lib/automation/lifecycleAutomationService';
import { emitLifecycleMarketingEvent } from '@/lib/automation/lifecycleMarketingEvents';
import {
  sendBookingPostVisitFollowupEmail,
  sendBookingUpcomingReminderEmail,
  sendRefitReminderLifecycleEmail,
  sendSavedFitReactivationEmail,
} from '@/lib/resend';
import { formatAppointmentLabel } from '@/lib/booking/calendar';
import { getServiceTypeConfig, isServiceType } from '@/lib/booking/serviceTypes';
import { getLifecycleEventMap, getKlaviyoTriggerPlan, getPosthogTriggerPlan } from '@/lib/automation/lifecycleEventMap';
import { createBookingManageToken } from '@/lib/session';

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
  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === '1';
  const now = new Date();

  // Verify cron secret if configured
  if (expectedSecret && cronSecret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const savedFitReactivationCandidates = await listSavedFitReactivationCandidates(
      now,
      DEFAULT_LIFECYCLE_AUTOMATION_CONFIG,
    );
    const refitCandidates = await listRefitReminderCandidates(now, DEFAULT_LIFECYCLE_AUTOMATION_CONFIG);
    const preEventCandidates = await listPreEventBookingReminderCandidates(
      now,
      DEFAULT_LIFECYCLE_AUTOMATION_CONFIG,
    );
    const postEventCandidates = await listPostEventFollowupCandidates(
      now,
      DEFAULT_LIFECYCLE_AUTOMATION_CONFIG,
    );

    const savedFitResults = await Promise.all(
      savedFitReactivationCandidates.map(async (profile) => {
        const emailRes = dryRun
          ? { ok: true, id: 'dry-run' }
          : await sendSavedFitReactivationEmail({
              to: profile.email,
              customerName: profile.profileName || 'Valued Customer',
              profileAgeDays: profile.ageDays,
              reactivationUrl: `${appBaseUrl}/fit/smart?campaign=saved-fit-reactivation&profile=${profile.id}`,
            });

        if (emailRes.ok) {
          await emitLifecycleMarketingEvent('saved_fit_reactivation_sent', {
            email: profile.email,
            distinctId: profile.customerId || profile.id,
            occurredAt: now.toISOString(),
            properties: {
              fitProfileId: profile.id,
              profileAgeDays: profile.ageDays,
              campaignId: `saved-fit-reactivation-${now.toISOString().slice(0, 10)}`,
              source: 'lifecycle-reminder-cron',
            },
          }).catch((error) => {
            console.error('saved_fit_reactivation_sent event emit failed:', error);
          });

          if (!dryRun) {
            await markSavedFitReactivationSent(profile.id, profile.technicalSpecs, now);
          }
        }

        return {
          flow: 'saved_fit_reactivation',
          success: emailRes.ok,
          profileId: profile.id,
          email: profile.email,
          ageDays: profile.ageDays,
          error: emailRes.ok ? undefined : emailRes.error,
        };
      }),
    );

    const refitResults = await Promise.all(
      refitCandidates.map(async (profile) => {
        const emailRes = dryRun
          ? { ok: true, id: 'dry-run' }
          : await sendRefitReminderLifecycleEmail({
              to: profile.email,
              customerName: profile.profileName || 'Valued Customer',
              profileAgeDays: profile.ageDays,
              lastFitDate: profile.updatedAt,
              reengagementLink: `${appBaseUrl}/fit/smart?campaign=refit-reminder&profile=${profile.id}`,
            });

        if (emailRes.ok) {
          await emitLifecycleMarketingEvent('refit_reminder_sent', {
            email: profile.email,
            distinctId: profile.customerId || profile.id,
            occurredAt: now.toISOString(),
            properties: {
              fitProfileId: profile.id,
              profileAgeDays: profile.ageDays,
              campaignId: `refit-reminder-${now.toISOString().slice(0, 10)}`,
              source: 'lifecycle-reminder-cron',
            },
          }).catch((error) => {
            console.error('refit_reminder_sent event emit failed:', error);
          });

          if (!dryRun) {
            await markRefitReminderSent(profile.id, profile.technicalSpecs, now);
          }
        }

        return {
          flow: 'refit_reminder',
          success: emailRes.ok,
          profileId: profile.id,
          email: profile.email,
          ageDays: profile.ageDays,
          error: emailRes.ok ? undefined : emailRes.error,
        };
      }),
    );

    const preEventResults = await Promise.all(
      preEventCandidates.map(async (booking) => {
        const location = readBookingLocationAddress(booking.location);
        const parts = toDateAndTimeSlot(booking.startAt);
        const serviceTypeConfig = isServiceType(booking.serviceType)
          ? await getServiceTypeConfig(booking.serviceType).catch(() => null)
          : null;
        const appointmentMode = serviceTypeConfig?.label || booking.serviceType;
        const manageToken = createBookingManageToken({
          bookingId: booking.id,
          email: booking.email,
        });

        const emailRes = dryRun
          ? { ok: true, id: 'dry-run' }
          : await sendBookingUpcomingReminderEmail({
              to: booking.email,
              appointmentLabel: formatAppointmentLabel(parts.date, parts.timeSlot),
              appointmentMode,
              location,
              manageUrl: `${appBaseUrl}/booking-confirmed?bookingId=${encodeURIComponent(booking.id)}&manageToken=${encodeURIComponent(manageToken)}`,
            });

        if (emailRes.ok) {
          await emitLifecycleMarketingEvent('booking_pre_event_reminder_sent', {
            email: booking.email,
            distinctId: booking.id,
            occurredAt: now.toISOString(),
            properties: {
              bookingId: booking.id,
              serviceType: booking.serviceType,
              startAtIso: booking.startAt.toISOString(),
              source: 'lifecycle-reminder-cron',
            },
          }).catch((error) => {
            console.error('booking_pre_event_reminder_sent event emit failed:', error);
          });

          if (!dryRun) {
            await markBookingPreEventReminderSent(booking.id, booking.notes, now);
          }
        }

        return {
          flow: 'booking_pre_event',
          success: emailRes.ok,
          bookingId: booking.id,
          email: booking.email,
          error: emailRes.ok ? undefined : emailRes.error,
        };
      }),
    );

    const postEventResults = await Promise.all(
      postEventCandidates.map(async (booking) => {
        const location = readBookingLocationAddress(booking.location);
        const parts = toDateAndTimeSlot(booking.startAt);
        const serviceTypeConfig = isServiceType(booking.serviceType)
          ? await getServiceTypeConfig(booking.serviceType).catch(() => null)
          : null;
        const appointmentMode = serviceTypeConfig?.label || booking.serviceType;

        const emailRes = dryRun
          ? { ok: true, id: 'dry-run' }
          : await sendBookingPostVisitFollowupEmail({
              to: booking.email,
              appointmentLabel: formatAppointmentLabel(parts.date, parts.timeSlot),
              appointmentMode,
              location,
              manageUrl: `${appBaseUrl}/dashboard`,
            });

        if (emailRes.ok) {
          await emitLifecycleMarketingEvent('booking_post_event_followup_sent', {
            email: booking.email,
            distinctId: booking.id,
            occurredAt: now.toISOString(),
            properties: {
              bookingId: booking.id,
              serviceType: booking.serviceType,
              startAtIso: booking.startAt.toISOString(),
              source: 'lifecycle-reminder-cron',
            },
          }).catch((error) => {
            console.error('booking_post_event_followup_sent event emit failed:', error);
          });

          if (!dryRun) {
            await markBookingPostEventFollowupSent(booking.id, booking.notes, now);
          }
        }

        return {
          flow: 'booking_post_event',
          success: emailRes.ok,
          bookingId: booking.id,
          email: booking.email,
          error: emailRes.ok ? undefined : emailRes.error,
        };
      }),
    );

    const allResults = [
      ...savedFitResults,
      ...refitResults,
      ...preEventResults,
      ...postEventResults,
    ];
    const successCount = allResults.filter((item) => item.success).length;

    return NextResponse.json({
      ok: true,
      message: `Processed ${successCount}/${allResults.length} lifecycle actions`,
      dryRun,
      lifecycleEventMap: getLifecycleEventMap(),
      triggerPlan: {
        klaviyo: getKlaviyoTriggerPlan(),
        posthog: getPosthogTriggerPlan(),
      },
      counts: {
        savedFitCandidates: savedFitReactivationCandidates.length,
        refitCandidates: refitCandidates.length,
        preEventCandidates: preEventCandidates.length,
        postEventCandidates: postEventCandidates.length,
      },
      profilesProcessed: savedFitReactivationCandidates.length + refitCandidates.length,
      bookingsProcessed: preEventCandidates.length + postEventCandidates.length,
      emailsSent: successCount,
      results: process.env.NODE_ENV === 'development' ? allResults : undefined,
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
  // Allow explicit GET invocation for test and diagnostics.
  return POST(request);
}
