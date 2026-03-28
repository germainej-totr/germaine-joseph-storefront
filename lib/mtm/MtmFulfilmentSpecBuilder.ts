/**
 * A20: Fulfilment Specification Pack — Core Builder
 *
 * Transforms a canonical MTM payload (optionally enriched with a fabric
 * record) into a fully structured `MtmFulfilmentSpec` that is:
 *   - human-readable (drives the spec-sheet component)
 *   - machine-readable (served as structured JSON for integration systems)
 *   - complete — no key garment details omitted
 *
 * Pure module — no side effects, no I/O.
 */

import { randomUUID } from 'crypto';
import type { MtmCanonicalPayload } from './MtmCanonicalSchema';
import type { Fabric } from '@/types/fabric';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const FULFILMENT_SPEC_SCHEMA_VERSION = '1.0' as const;

export type ProductionStage =
  | 'cutting'
  | 'construction'
  | 'details'
  | 'finishing'
  | 'quality';

export type ProductionLinePriority = 'critical' | 'standard' | 'cosmetic';

export interface MtmProductionLineItem {
  /** Production workflow stage */
  stage: ProductionStage;
  /** Machine-stable identifier */
  key: string;
  /** Human label for the spec sheet */
  label: string;
  /** Value to produce */
  value: string;
  /** Optional tailor guidance note */
  notes?: string;
  /** How critical a deviation from this item is */
  priority: ProductionLinePriority;
}

export interface MtmQualityGate {
  key: string;
  description: string;
  checkType: 'measurement' | 'visual' | 'functional';
}

export interface MtmFabricSpec {
  code: string;
  name?: string;
  mill?: string;
  composition?: string;
  weightGm?: number;
  pattern?: string;
  colourFamily?: string;
  careInstructions?: string;
  isLimitedEdition?: boolean;
  upchargePence?: number;
}

export interface MtmFulfilmentSpec {
  /** Unique identifier for this spec document */
  specId: string;
  /** Reference to the ProductionSpec/order record */
  orderId: string;
  /** ISO timestamp of generation */
  generatedAt: string;
  /** Schema version for downstream parsers */
  schemaVersion: typeof FULFILMENT_SPEC_SCHEMA_VERSION;

  // --- Customer ---
  customer: {
    email: string;
    fitProfileId?: string;
    bookingId?: string;
    fitPreference?: string;
    appointmentDate?: string;
    appointmentTime?: string;
  };

  // --- Garment ---
  garment: {
    category: string;
    optionSet?: string;
    optionSetVersion?: string;
    /** Merged design + spec options (design selections take priority) */
    options: Record<string, string>;
    fabric: MtmFabricSpec | null;
  };

  // --- Measurements ---
  measurements: {
    /** Anatomical body measurements in cm */
    body: Record<string, number>;
  };

  // --- Production ---
  productionNotes?: string;
  productionLines: MtmProductionLineItem[];
  qualityGates: MtmQualityGate[];

  // --- Pricing ---
  pricing?: {
    basePence?: number;
    fabricUpchargePence?: number;
    breakdown?: Array<{ key: string; label: string; amountPence: number }>;
    totalPence?: number;
  };

  // --- Meta ---
  meta: {
    payloadVersion: string;
    fitGateVersion?: string;
    generatedBy: 'gjm-fulfilment-v1';
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mergeOptions(
  designSelections: Record<string, string>,
  specOptions: Record<string, string>,
): Record<string, string> {
  // Design selections are the canonical customer choices; spec options may
  // carry the same keys (they are derived from design).  Merge with design
  // taking priority.
  return { ...specOptions, ...designSelections };
}

function extractBodyMeasurements(payload: MtmCanonicalPayload): Record<string, number> {
  const measurements: Record<string, number> = {};

  // 1. Try fit context (richer, includes tailor-measured data)
  const fit = payload.fit;
  if (fit && typeof fit === 'object') {
    const ctx = fit as Record<string, unknown>;
    const raw = ctx.measurements ?? ctx.attributes ?? {};
    if (typeof raw === 'object' && raw !== null) {
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof v === 'number') measurements[k] = v;
      }
    }
  }

  // 2. Fallback to mtmSpec measurements
  if (Object.keys(measurements).length === 0 && payload.mtmSpec?.measurements) {
    for (const [k, v] of Object.entries(payload.mtmSpec.measurements)) {
      if (typeof v === 'number') measurements[k] = v;
    }
  }

  return measurements;
}

function buildFabricSpec(
  fabricCode: string | undefined,
  fabricRecord: Fabric | undefined | null,
): MtmFabricSpec | null {
  if (!fabricCode && !fabricRecord) return null;

  const code = fabricRecord?.articleCode ?? fabricCode ?? 'UNKNOWN';

  return {
    code,
    name: fabricRecord?.name,
    mill: fabricRecord?.mill,
    composition: fabricRecord?.composition,
    weightGm: fabricRecord?.weightGm,
    pattern: fabricRecord?.pattern,
    colourFamily: fabricRecord?.colourFamily,
    careInstructions: fabricRecord?.careInstructions,
    isLimitedEdition: fabricRecord?.isLimitedEdition,
    upchargePence: fabricRecord?.upchargePence,
  };
}

function extractPricing(
  payload: MtmCanonicalPayload,
  fabric: MtmFabricSpec | null,
): MtmFulfilmentSpec['pricing'] | undefined {
  const design = payload.design;
  if (!design && !fabric) return undefined;

  const pricing = design?.pricing as
    | { total?: number; breakdown?: Array<{ key: string; label: string; amount: number }> }
    | undefined;

  const breakdown = pricing?.breakdown?.map((b) => ({
    key: b.key,
    label: b.label,
    amountPence: b.amount,
  }));

  const fabricUpcharge = fabric?.upchargePence;

  if (!pricing?.total && !fabricUpcharge) return undefined;

  return {
    basePence: pricing?.total != null ? pricing.total - (fabricUpcharge ?? 0) : undefined,
    fabricUpchargePence: fabricUpcharge,
    breakdown,
    totalPence: pricing?.total,
  };
}

// ---------------------------------------------------------------------------
// Production line + quality gate builders
// ---------------------------------------------------------------------------

import { buildProductionLines, buildQualityGates } from './MtmProductionSummary';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface BuildFulfilmentSpecOptions {
  /** Optional enriched fabric record pulled from the fabric catalogue */
  fabric?: Fabric | null;
}

/**
 * Build a structured fulfilment specification from a canonical MTM payload.
 *
 * @param orderId   The ProductionSpec.id or external order reference
 * @param payload   Validated canonical MTM payload
 * @param options   Optional enrichment (fabric record)
 */
export function buildFulfilmentSpec(
  orderId: string,
  payload: MtmCanonicalPayload,
  options: BuildFulfilmentSpecOptions = {},
): MtmFulfilmentSpec {
  const { fabric } = options;
  const specId = `spec_${randomUUID()}`;
  const generatedAt = new Date().toISOString();

  const fp = payload.fitProfile;
  const designSelections = (() => {
    const d = payload.design;
    if (!d) return {};
    const s = d.selections;
    return typeof s === 'object' && s !== null ? (s as Record<string, string>) : {};
  })();
  const specOptions =
    typeof payload.mtmSpec?.options === 'object' && payload.mtmSpec.options !== null
      ? (payload.mtmSpec.options as Record<string, string>)
      : {};

  const mergedOptions = mergeOptions(designSelections, specOptions);
  const bodyMeasurements = extractBodyMeasurements(payload);
  const fabricSpec = buildFabricSpec(payload.mtmSpec?.fabricCode, fabric);
  const pricing = extractPricing(payload, fabricSpec);

  const garment = {
    category: payload.category,
    optionSet: payload.design?.optionSet ?? undefined,
    optionSetVersion: payload.design?.optionSetVersion ?? undefined,
    options: mergedOptions,
    fabric: fabricSpec,
  };

  const productionLines = buildProductionLines(garment, bodyMeasurements);
  const qualityGates = buildQualityGates(payload.category, bodyMeasurements);

  return {
    specId,
    orderId,
    generatedAt,
    schemaVersion: FULFILMENT_SPEC_SCHEMA_VERSION,

    customer: {
      email: fp.email,
      fitProfileId: fp.fitProfileId ?? undefined,
      bookingId: fp.bookingId ?? undefined,
      fitPreference: fp.fitPreference ?? undefined,
      appointmentDate: fp.appointmentDate ?? undefined,
      appointmentTime: fp.appointmentTime ?? undefined,
    },

    garment,
    measurements: { body: bodyMeasurements },

    productionNotes: payload.mtmSpec?.notes,
    productionLines,
    qualityGates,
    pricing,

    meta: {
      payloadVersion: payload.version ?? 'v1',
      fitGateVersion: payload.mtmSpec?.fitGateVersion,
      generatedBy: 'gjm-fulfilment-v1',
    },
  };
}

/**
 * Serialise a fulfilment spec to a machine-readable JSON string.
 * Intended for export / integration handoff.
 */
export function serialiseFulfilmentSpec(spec: MtmFulfilmentSpec): string {
  return JSON.stringify(spec, null, 2);
}
