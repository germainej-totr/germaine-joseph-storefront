export const LIFECYCLE_AUTOMATION_EVENTS = [
  'saved_fit_reactivation_sent',
  'refit_reminder_sent',
  'booking_pre_event_reminder_sent',
  'booking_post_event_followup_sent',
  'booking_confirmed',
  'booking_rescheduled',
  'booking_cancelled',
  'booking_fit_refresh_required',
] as const;

export type LifecycleAutomationEventName = (typeof LIFECYCLE_AUTOMATION_EVENTS)[number];

export interface LifecycleEventDefinition {
  eventName: LifecycleAutomationEventName;
  trigger: string;
  mtmStateSource: string;
  klaviyoMetric: string;
  posthogEvent: string;
  targetWindow: string;
  primaryKpi: string;
}

const EVENT_MAP: LifecycleEventDefinition[] = [
  {
    eventName: 'saved_fit_reactivation_sent',
    trigger: 'Fit profile age enters reactivation window before staleness threshold',
    mtmStateSource: 'FitProfile.updatedAt + A17 freshness policy',
    klaviyoMetric: 'saved_fit_reactivation_sent',
    posthogEvent: 'saved_fit_reactivation_sent',
    targetWindow: '150-179 days since profile update',
    primaryKpi: 'reactivation_click_rate',
  },
  {
    eventName: 'refit_reminder_sent',
    trigger: 'Fit profile is stale and customer is due for measurement refresh',
    mtmStateSource: 'FitProfile.updatedAt + A17 stale profile policy',
    klaviyoMetric: 'refit_reminder_sent',
    posthogEvent: 'refit_reminder_sent',
    targetWindow: '>= 180 days since profile update',
    primaryKpi: 'refit_booking_start_rate',
  },
  {
    eventName: 'booking_pre_event_reminder_sent',
    trigger: 'Upcoming confirmed booking enters pre-event reminder window',
    mtmStateSource: 'Booking.startAt + Booking.status',
    klaviyoMetric: 'booking_pre_event_reminder_sent',
    posthogEvent: 'booking_pre_event_reminder_sent',
    targetWindow: '24 hours before appointment',
    primaryKpi: 'no_show_reduction',
  },
  {
    eventName: 'booking_post_event_followup_sent',
    trigger: 'Confirmed booking exits event and enters follow-up window',
    mtmStateSource: 'Booking.startAt + Booking.status',
    klaviyoMetric: 'booking_post_event_followup_sent',
    posthogEvent: 'booking_post_event_followup_sent',
    targetWindow: '48 hours after appointment',
    primaryKpi: 'repeat_purchase_rate',
  },
  {
    eventName: 'booking_confirmed',
    trigger: 'Booking created and confirmed immediately',
    mtmStateSource: 'BookingService.createBooking',
    klaviyoMetric: 'booking_confirmed',
    posthogEvent: 'booking_confirmed',
    targetWindow: 'Immediate',
    primaryKpi: 'confirmation_delivery_rate',
  },
  {
    eventName: 'booking_fit_refresh_required',
    trigger: 'Booking held pending fit profile refresh',
    mtmStateSource: 'BookingService.createBooking pending_fit_refresh',
    klaviyoMetric: 'booking_fit_refresh_required',
    posthogEvent: 'booking_fit_refresh_required',
    targetWindow: 'Immediate',
    primaryKpi: 'fit_refresh_completion_rate',
  },
  {
    eventName: 'booking_rescheduled',
    trigger: 'Booking schedule updated',
    mtmStateSource: 'Booking update/reschedule API',
    klaviyoMetric: 'booking_rescheduled',
    posthogEvent: 'booking_rescheduled',
    targetWindow: 'Immediate',
    primaryKpi: 'reschedule_completion_rate',
  },
  {
    eventName: 'booking_cancelled',
    trigger: 'Booking cancelled by customer/staff action',
    mtmStateSource: 'Booking update cancel action',
    klaviyoMetric: 'booking_cancelled',
    posthogEvent: 'booking_cancelled',
    targetWindow: 'Immediate',
    primaryKpi: 'rebook_recovery_rate',
  },
];

export function getLifecycleEventMap(): LifecycleEventDefinition[] {
  return EVENT_MAP.slice();
}

export function getKlaviyoTriggerPlan() {
  return EVENT_MAP.map((event) => ({
    metric: event.klaviyoMetric,
    trigger: event.trigger,
    source: event.mtmStateSource,
    targetWindow: event.targetWindow,
  }));
}

export function getPosthogTriggerPlan() {
  return EVENT_MAP.map((event) => ({
    event: event.posthogEvent,
    trigger: event.trigger,
    source: event.mtmStateSource,
    primaryKpi: event.primaryKpi,
  }));
}
