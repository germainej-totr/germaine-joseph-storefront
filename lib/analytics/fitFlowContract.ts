export const FIT_FLOW_EVENT_NAMES = [
  'gjm_fit_flow_start',
  'gjm_fit_flow_save_success',
  'gjm_fit_flow_save_failure',
] as const;

export type FitFlowEventName = (typeof FIT_FLOW_EVENT_NAMES)[number];

export interface FitFlowEventPayload {
  event_name: FitFlowEventName;
  occurred_at: string;
  flow_name: 'smart' | 'manual' | 'configure';
  email?: string;
  fit_profile_id?: string;
  product_handle?: string;
  variant_id?: string;
  destination?: string;
  error_message?: string;
  source?: string;
}
