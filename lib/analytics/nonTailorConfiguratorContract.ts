export const NON_TAILOR_CONFIGURATOR_EVENT_NAMES = [
  'gjm_non_tailor_config_view',
  'gjm_non_tailor_config_option_change',
  'gjm_non_tailor_config_add_to_cart',
] as const;

export type NonTailorConfiguratorEventName = (typeof NON_TAILOR_CONFIGURATOR_EVENT_NAMES)[number];

export interface NonTailorConfiguratorEventPayload {
  event_name: NonTailorConfiguratorEventName;
  occurred_at: string;
  product_handle: string;
  product_type: string;
  mtm_category: string;
  variant_id?: string;
  fit_profile_id?: string;
  option_name?: string;
  option_value?: string;
  selected_options_count?: number;
  custom_notes_present?: boolean;
  source?: string;
}