import type { MtmGateEventName } from '@/lib/analytics/mtmGateContract';

export interface PostHogDashboardBlock<TEvent = string> {
  key: string;
  title: string;
  insightType: 'Trends' | 'Funnel' | 'Retention';
  question: string;
  events?: TEvent[];
  formula?: string;
  breakdowns?: string[];
  filters?: Array<{ property: string; operator: string; value: string | number }>;
}

export interface PostHogDashboardPack<TEvent = string> {
  id: string;
  name: string;
  description: string;
  blocks: PostHogDashboardBlock<TEvent>[];
}

export const MTM_GATE_DASHBOARD_PACK: PostHogDashboardPack<MtmGateEventName> = {
  id: 'gjm-mtm-gate-v1',
  name: 'GJM MTM Gate Performance',
  description:
    'Decision and action visibility for product-level MTM gating across MTM-required catalogue products.',
  blocks: [
    {
      key: 'gate_decision_mix',
      title: 'Gate Decision Mix',
      insightType: 'Trends',
      question: 'How are users distributed across MTM gate decision outcomes?',
      events: [
        'gjm_gate_full_mtm_required',
        'gjm_gate_saved_fit_eligible',
        'gjm_gate_refit_recommended',
        'gjm_gate_unauthenticated',
        'gjm_gate_profile_not_owned',
      ],
      breakdowns: ['mtm_category', 'product_handle'],
    },
    {
      key: 'saved_fit_acceptance_rate',
      title: 'Saved-Fit Acceptance Rate',
      insightType: 'Funnel',
      question: 'When users are saved-fit eligible, how many choose to use saved fit?',
      events: ['gjm_gate_saved_fit_eligible', 'gjm_use_saved_fit_clicked'],
      formula: 'gjm_use_saved_fit_clicked / gjm_gate_saved_fit_eligible',
      breakdowns: ['mtm_category', 'product_handle'],
    },
    {
      key: 'refit_recommendation_frequency',
      title: 'Refit Recommendation Frequency',
      insightType: 'Trends',
      question: 'How often are customers classified as refit recommended?',
      events: ['gjm_gate_refit_recommended'],
      breakdowns: ['mtm_category', 'product_handle', 'profile_age_days'],
    },
    {
      key: 'modal_action_split',
      title: 'Modal Action Split',
      insightType: 'Funnel',
      question: 'After modal exposure, do users continue with saved fit or start a new fitting?',
      events: [
        'gjm_saved_fit_modal_shown',
        'gjm_refit_recommended_modal_shown',
        'gjm_use_saved_fit_clicked',
        'gjm_start_new_fitting_clicked',
      ],
      breakdowns: ['mtm_category', 'product_handle'],
    },
    {
      key: 'full_mtm_start_ratio',
      title: 'Full-MTM Start Ratio',
      insightType: 'Funnel',
      question: 'When full MTM is required, how often do users start a new fitting?',
      events: ['gjm_gate_full_mtm_required', 'gjm_start_new_fitting_clicked'],
      formula: 'gjm_start_new_fitting_clicked / gjm_gate_full_mtm_required',
      breakdowns: ['mtm_category', 'product_handle'],
    },
  ],
};
