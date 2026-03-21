export const MTM_GATE_EVENT_NAMES = [
  'gjm_gate_full_mtm_required',
  'gjm_gate_saved_fit_eligible',
  'gjm_gate_refit_recommended',
  'gjm_gate_unauthenticated',
  'gjm_gate_profile_not_owned',
  'gjm_use_saved_fit_clicked',
  'gjm_start_new_fitting_clicked',
  'gjm_saved_fit_modal_shown',
  'gjm_refit_recommended_modal_shown',
] as const;

export type MtmGateEventName = (typeof MTM_GATE_EVENT_NAMES)[number];

export interface MtmGateEventPayload {
  product_handle: string;
  product_type: string;
  mtm_category: string;
  variant_id: string;
  customer_id?: string;
  fit_profile_id?: string;
  gate_decision?: string;
  gate_reason?: string;
  profile_age_days?: number;
  event_name: MtmGateEventName;
  occurred_at: string;
}
