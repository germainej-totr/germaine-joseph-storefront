export type MtmCategory = "suit" | "shirt" | "trouser" | "overcoat" | "blazer" | "vest" | "jacket";

/**
 * Re-export generic canonical payload type from MTM schema
 * This is the standard contract across design, fit, booking, commerce, and order systems
 */
export type { MtmCanonicalPayload, MtmCanonicalPayloadStrict } from '../lib/mtm/MtmCanonicalSchema.ts';

export interface GJOptionSet {
  id?: string;
  handle?: string;
  title: string;
  category: MtmCategory;
  version: string;
  options: GJOption[];
  defaultConfig?: Record<string, string>;
  pricingRules?: Record<string, unknown>;
}

export interface GJOption {
  id?: string;
  handle?: string;
  key: string;
  label: string;
  type: 'select' | 'toggle' | 'radio' | 'text';
  choices: GJChoice[];
  uiHint?: string;
  dependsOn?: Record<string, string>;
  validation?: Record<string, unknown>;
}

export interface GJChoice {
  id?: string;
  handle?: string;
  value: string;
  label: string;
  priceDelta?: number;
  image?: string;
  tags?: string[];
}

/** Immutable snapshot attached to cart line item and copied to ProductionSpec */
export interface MtmSpec {
  category: MtmCategory;
  fabricCode?: string;
  options: Record<string, string>;
  measurements: Record<string, number>;
  notes?: string;
  fitGateVersion?: string;
  fitProfileId?: string;
}

/** Properties written to Shopify cart line item for MTM orders */
export interface MtmLineItemProperties {
  fit_profile_id: string;
  mtm_spec: string;        // JSON.stringify(MtmSpec)
  mtm_category: MtmCategory;
  mtm_options: string;     // JSON.stringify(Record<string, string>)
  measurements: string;    // JSON.stringify(Record<string, number>)
  fit_gate_version: string;
}

export interface GJFabric {
  id?: string;
  handle?: string;
  fabricCode: string;
  mill: string;
  composition: string;
  weightGsm: number;
  priceTier: string;
  season?: string;
  weave?: string;
  colour?: string;
  availabilityStatus?: string;
  swatchImage?: string;
  heroImage?: string;
}

export interface GJServiceType {
  id?: string;
  handle?: string;
  name: string;
  durationMin: number;
  depositAmount: number;
  leadTimeHours: number;
  travelRequired: boolean;
  zones?: { radius_km?: number; flat_fee?: number };
}

export interface GJMeasurementGuide {
  id?: string;
  handle?: string;
  category: MtmCategory;
  fields: Array<{ key: string; label: string; unit: string; hint?: string }>;
}