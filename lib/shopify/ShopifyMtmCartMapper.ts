import type { CanonicalTrouserMtmPayload } from '@/lib/trouser/TrouserMtmPayload';

/**
 * Shopify line item custom attributes use a flat key/value string model.
 * This mapper converts canonical MTM payloads into Shopify-compatible line item properties
 * under the gjm namespace convention.
 */

export type ShopifyLineItemAttributes = Record<string, string>;

export interface ShopifyMtmLineItemInput {
  productId: string;
  variantId: string;
  quantity?: number;
  customAttributes: ShopifyLineItemAttributes;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

/**
 * Maps a canonical trouser MTM payload to Shopify line item custom attributes.
 * All keys are prefixed with gjm_ to maintain namespace consistency.
 *
 * Resulting attributes include:
 * - gjm_mtm_category
 * - gjm_mtm_option_set
 * - gjm_mtm_option_set_version
 * - gjm_trouser_selections
 * - gjm_trouser_pricing
 * - gjm_trouser_validation
 * - gjm_fit_profile_id
 * - gjm_design_summary
 * - gjm_mtm_canonical (full payload)
 */
export function mapCanonicalPayloadToLineItemAttributes(
  payload: CanonicalTrouserMtmPayload,
): ShopifyLineItemAttributes {
  const attrs: ShopifyLineItemAttributes = {
    // Core MTM metadata
    gjm_mtm_category: payload.category,
    gjm_mtm_option_set: payload.design?.optionSet || 'trouser-core-v1',
    gjm_mtm_option_set_version: payload.design?.optionSetVersion || 'v1',

    // Design selections and pricing
    gjm_trouser_selections: safeStringify(payload.design?.selections || {}),
    gjm_trouser_pricing_total: String(payload.design?.pricing.total || 0),
    gjm_trouser_pricing_breakdown: safeStringify(payload.design?.pricing.breakdown || []),
    gjm_trouser_validation: safeStringify(payload.design?.validation || {}),

    // Fit profile reference
    ...(payload.fitProfile.bookingId && {
      gjm_fit_profile_id: payload.fitProfile.bookingId,
    }),

    // Fit intake measurements
    gjm_fit_email: payload.fitProfile.email,
    gjm_fit_preference: payload.fitProfile.fitPreference,
    gjm_fit_jacket_size: String(payload.fitProfile.jacketSize),
    gjm_fit_trouser_size: String(payload.fitProfile.trouserSize),
    gjm_fit_appointment_date: payload.fitProfile.appointmentDate,
    gjm_fit_appointment_time: payload.fitProfile.appointmentTime,

    // Design summary (compact human-readable version)
    gjm_design_summary: formatDesignSummary(payload),

    // Full canonical payload for backend reconstruction
    gjm_mtm_canonical: safeStringify(payload),
  };

  return attrs;
}

function formatDesignSummary(payload: CanonicalTrouserMtmPayload): string {
  if (!payload.design) {
    return 'No design selected';
  }

  const designItems = Object.entries(payload.design.selections)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' | ');

  const price = `€${payload.design.pricing.total.toFixed(2)}`;
  return `${designItems} (${price})`;
}

/**
 * Builds a complete Shopify line item input for adding a trouser product to cart
 * with all necessary MTM metadata attached.
 */
export function buildTrouserLineItemInput(
  productVariantId: string,
  canonicalPayload: CanonicalTrouserMtmPayload,
  quantity: number = 1,
): ShopifyMtmLineItemInput {
  return {
    productId: '', // Will be resolved from variantId
    variantId: productVariantId,
    quantity,
    customAttributes: mapCanonicalPayloadToLineItemAttributes(canonicalPayload),
  };
}
