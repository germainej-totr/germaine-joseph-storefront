/**
 * Lifecycle automation events — triggered by cron jobs and user re-engagement flows
 * These complement MTM gate events to track retention and reactivation
 */

export const LIFECYCLE_EVENT_NAMES = [
  'fit_check_reminder_sent',          // Sent 6-month reminder email
  'refit_reactivation_triggered',     // Profile marked as needs-refit
  'reengage_stale_profile_started',   // Automation email sent to inactive customer
  'fit_check_reminder_clicked',       // User clicked link in reminder email
  'refit_reactivation_accepted',      // User accepted refit suggestion and started fitting flow
] as const;

export type LifecycleEventName = (typeof LIFECYCLE_EVENT_NAMES)[number];

export interface LifecycleEventPayload {
  event_name: LifecycleEventName;
  occurred_at: string;
  customer_id: string;                // Shopify customer ID or email fallback
  fit_profile_id: string;
  campaign_id?: string;               // e.g., 'lifecycle-reminder-2026-03-22'
  profile_age_days: number;           // Days since profile was last updated
  trigger_reason?: string;            // 'passed_6_month_threshold' | 'user_clicked_link' | etc.
  properties?: Record<string, unknown>;
}
