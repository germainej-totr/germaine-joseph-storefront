export const MTM_FUNNEL_EVENT_NAMES = [
  'gjm_mtm_configurator_start',
  'gjm_mtm_option_change',
  'gjm_mtm_fit_completion',
  'gjm_mtm_booking_created',
  'gjm_mtm_deposit_paid',
  'gjm_mtm_cart_add',
  'gjm_mtm_checkout_start',
  'gjm_mtm_order_completed',
] as const;

export type MtmFunnelEventName = (typeof MTM_FUNNEL_EVENT_NAMES)[number];

export interface MtmFunnelEventPayload {
  event_name: MtmFunnelEventName;
  occurred_at: string;
  product_handle?: string;
  product_type?: string;
  mtm_category?: string;
  variant_id?: string;
  customer_id?: string;
  fit_profile_id?: string;
  booking_id?: string;
  order_id?: string;
  service_type?: string;
  entry_path?: 'saved_fit' | 'full_mtm' | 'refit';
  option_name?: string;
  option_value?: string;
  funnel_step?: string;
  source?: string;
  properties?: Record<string, unknown>;
}
