import type { MtmFunnelEventName } from '@/lib/analytics/mtmFunnelContract';
import type { PostHogDashboardPack } from '@/lib/analytics/posthogMtmDashboardPack';

export const MTM_FUNNEL_DASHBOARD_PACK: PostHogDashboardPack<MtmFunnelEventName> = {
  id: 'gjm-mtm-funnel-v1',
  name: 'GJM MTM Funnel Intelligence',
  description:
    'End-to-end MTM funnel visibility from configurator start through order completion, with drop-off and category comparisons.',
  blocks: [
    {
      key: 'mtm_full_funnel',
      title: 'MTM Full Funnel',
      insightType: 'Funnel',
      question: 'Where are users dropping off from configurator start to completed order?',
      events: [
        'gjm_mtm_configurator_start',
        'gjm_mtm_fit_completion',
        'gjm_mtm_booking_created',
        'gjm_mtm_cart_add',
        'gjm_mtm_checkout_start',
        'gjm_mtm_order_completed',
      ],
      breakdowns: ['mtm_category'],
    },
    {
      key: 'mtm_option_change_intensity',
      title: 'MTM Option Change Intensity',
      insightType: 'Trends',
      question: 'How much design option interaction occurs before conversion?',
      events: ['gjm_mtm_option_change'],
      breakdowns: ['mtm_category', 'option_name'],
    },
    {
      key: 'saved_fit_vs_full_mtm',
      title: 'Saved-Fit vs Full-MTM Performance',
      insightType: 'Funnel',
      question: 'How does conversion differ by entry path (saved fit, full MTM, refit)?',
      events: ['gjm_mtm_configurator_start', 'gjm_mtm_cart_add', 'gjm_mtm_order_completed'],
      breakdowns: ['entry_path', 'mtm_category'],
    },
    {
      key: 'booking_to_order_dropoff',
      title: 'Booking to Order Drop-Off',
      insightType: 'Funnel',
      question: 'Where do users drop after booking creation?',
      events: ['gjm_mtm_booking_created', 'gjm_mtm_cart_add', 'gjm_mtm_checkout_start', 'gjm_mtm_order_completed'],
      breakdowns: ['service_type', 'mtm_category'],
    },
    {
      key: 'deposit_paid_to_order',
      title: 'Deposit Paid to Order Completion',
      insightType: 'Funnel',
      question: 'How many deposit-paid journeys complete into finalized orders?',
      events: ['gjm_mtm_deposit_paid', 'gjm_mtm_order_completed'],
      breakdowns: ['mtm_category'],
    },
    {
      key: 'category_comparison_conversion',
      title: 'Category Comparison Conversion',
      insightType: 'Trends',
      question: 'Which MTM categories convert best at each funnel stage?',
      events: [
        'gjm_mtm_configurator_start',
        'gjm_mtm_fit_completion',
        'gjm_mtm_booking_created',
        'gjm_mtm_cart_add',
        'gjm_mtm_checkout_start',
        'gjm_mtm_order_completed',
      ],
      breakdowns: ['mtm_category', 'funnel_step'],
    },
  ],
};
