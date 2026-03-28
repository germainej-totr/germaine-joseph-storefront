import type { CanonicalTrouserMtmPayload } from '@/lib/trouser/TrouserMtmPayload';

/**
 * Shopify order context extracted from gjm_* line item attributes.
 * Used for downstream fulfilment visibility and MTM context reconstruction.
 */
export interface ShopifyOrderMtmContext {
  /**
   * Shopify order ID
   */
  orderId: string;
  /**
   * Customer email from order
   */
  customerEmail: string;
  /**
   * Line items with MTM metadata extracted
   */
  lineItems: ShopifyOrderMtmLineItem[];
  /**
   * Complete workshop notes built from all items
   */
  workshopNote: string;
  /**
   * Whether all line items have MTM context
   */
  isCompletelyMapped: boolean;
}

export interface ShopifyOrderMtmLineItem {
  /**
   * Unique line item ID from Shopify order
   */
  id: string;
  /**
   * Product variant title
   */
  title: string;
  /**
   * Quantity ordered
   */
  quantity: number;
  /**
   * Fit profile ID if present
   */
  fitProfileId?: string;
  /**
   * MTM category (trouser, jacket, etc.)
   */
  category?: string;
  /**
   * Canonical payload reconstructed from attributes
   */
  canonicalPayload?: Partial<CanonicalTrouserMtmPayload>;
  /**
   * Raw gjm_* attributes for audit trail
   */
  gjmAttributes: Record<string, string>;
}

/**
 * Safe JSON parsing with fallback to null
 */
function safeParseJson(value: unknown): unknown {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Extract gjm_* line item attributes from order
 * Maps Shopify property format to flat key/value
 */
function extractLineItemAttributes(
  properties: Array<{ name?: string; value?: unknown }> | undefined,
): Record<string, string> {
  const attrs: Record<string, string> = {};

  if (!Array.isArray(properties)) {
    return attrs;
  }

  for (const prop of properties) {
    const key = prop.name;
    const value = prop.value;

    if (key && typeof value === 'string') {
      attrs[key] = value;
    }
  }

  return attrs;
}

/**
 * Reconstruct partial canonical payload from line item attributes
 */
function reconstructCanonicalPayload(
  attrs: Record<string, string>,
): Partial<CanonicalTrouserMtmPayload> {
  const canonical = safeParseJson(attrs.gjm_mtm_canonical);
  if (canonical && typeof canonical === 'object' && !Array.isArray(canonical)) {
    return canonical as Partial<CanonicalTrouserMtmPayload>;
  }

  // Fallback to building from individual attributes
  const mtmSpec = safeParseJson(attrs.gjm_mtm_spec);

  const payload: Partial<CanonicalTrouserMtmPayload> = {
    fitProfile: {
      fitProfileId: attrs.gjm_fit_profile_id,
      bookingId: attrs.gjm_booking_id,
      email: attrs.gjm_fit_email,
      fitPreference: attrs.gjm_fit_preference,
      jacketSize: parseInt(attrs.gjm_fit_jacket_size || '0', 10) || undefined,
      trouserSize: parseInt(attrs.gjm_fit_trouser_size || '0', 10) || undefined,
      appointmentDate: attrs.gjm_fit_appointment_date,
      appointmentTime: attrs.gjm_fit_appointment_time,
    } as any,
  };

  // Add mtmSpec if available
  if (mtmSpec && typeof mtmSpec === 'object' && !Array.isArray(mtmSpec)) {
    payload.mtmSpec = mtmSpec as any;
  }

  return payload;
}

/**
 * Format design summary from line item attributes
 */
function formatDesignSummary(attrs: Record<string, string>): string {
  const summary = attrs.gjm_design_summary;
  if (summary) {
    return summary;
  }

  const category = attrs.gjm_mtm_category || 'unknown';
  const price = attrs.gjm_trouser_pricing_total || '0.00';
  return `${category} - €${price}`;
}

/**
 * Build workshop note from line item measurements
 */
function buildLineItemWorkshopNote(attrs: Record<string, string>): string {
  const measurements = safeParseJson(attrs.gjm_measurements);

  if (!measurements || typeof measurements !== 'object' || Array.isArray(measurements)) {
    const profile = extractLineItemAttributes([]);
    return `Item: ${attrs.gjm_mtm_category || 'unknown'}\nNo measurement data captured`;
  }

  const noteContent = Object.entries(measurements as Record<string, unknown>)
    .map(([key, value]) => `${key.toUpperCase()}: ${String(value)}cm`)
    .join('\n');

  return `--- MTM SPEC DATA ---\n${noteContent}\n--- END SPEC DATA ---`;
}

/**
 * Extract MTM context from a Shopify order webhook payload
 *
 * @param orderId Shopify order ID
 * @param customerEmail Customer email from order
 * @param lineItems Order line items with properties
 * @returns Extracted MTM context for fulfilment
 */
export function extractMtmContextFromOrder(
  orderId: string,
  customerEmail: string,
  lineItems: Array<{
    id?: string | number;
    title?: string;
    quantity?: number;
    properties?: Array<{ name?: string; value?: unknown }>;
  }>,
): ShopifyOrderMtmContext {
  const mtmLineItems: ShopifyOrderMtmLineItem[] = [];
  const workshopNotes: string[] = [];
  let completeCount = 0;

  for (const item of lineItems) {
    const itemId = item.id ? String(item.id) : `unknown-${mtmLineItems.length}`;
    const title = item.title || 'Unknown Product';
    const quantity = item.quantity || 1;

    const gjmAttributes = extractLineItemAttributes(item.properties);
    const fitProfileId = gjmAttributes.gjm_fit_profile_id || gjmAttributes.fit_profile_id;
    const category = gjmAttributes.gjm_mtm_category;
    const canonicalPayload = reconstructCanonicalPayload(gjmAttributes);

    mtmLineItems.push({
      id: itemId,
      title,
      quantity,
      fitProfileId,
      category,
      canonicalPayload,
      gjmAttributes,
    });

    if (fitProfileId && category) {
      completeCount++;
      workshopNotes.push(buildLineItemWorkshopNote(gjmAttributes));
    }
  }

  const workshopNote =
    workshopNotes.length > 0
      ? workshopNotes.join('\n\n')
      : `Order ${orderId} for ${customerEmail}: No MTM line items found`;

  return {
    orderId,
    customerEmail,
    lineItems: mtmLineItems,
    workshopNote,
    isCompletelyMapped: completeCount === mtmLineItems.length && mtmLineItems.length > 0,
  };
}

/**
 * Extract all fit profile references from an order
 * Useful for linking orders to fit sessions
 *
 * @param context Order MTM context
 * @returns Array of unique fit profile IDs
 */
export function extractFitProfilesFromOrder(context: ShopifyOrderMtmContext): string[] {
  const fitProfiles = new Set<string>();

  for (const item of context.lineItems) {
    if (item.fitProfileId) {
      fitProfiles.add(item.fitProfileId);
    }
  }

  return Array.from(fitProfiles);
}

/**
 * Check if order contains MTM items
 */
export function isOrderMtm(context: ShopifyOrderMtmContext): boolean {
  return context.lineItems.some((item) => !!item.category);
}

/**
 * Get summary of all MTM line items in order
 */
export function getOrderMtmSummary(
  context: ShopifyOrderMtmContext,
): { categoryCount: Record<string, number>; itemCount: number; fitProfileCount: number } {
  const categoryCount: Record<string, number> = {};
  let fitProfileCount = 0;

  for (const item of context.lineItems) {
    if (item.category) {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + item.quantity;
    }
    if (item.fitProfileId) {
      fitProfileCount++;
    }
  }

  return {
    categoryCount,
    itemCount: context.lineItems.length,
    fitProfileCount,
  };
}
