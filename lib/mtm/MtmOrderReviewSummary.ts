/**
 * A19: Admin and Internal Review Layer
 *
 * Builds a structured, human-readable summary of an MTM order
 * from its canonical payload, fit profile, and (optionally) a booking
 * record. The result drives the reviewer checklist, readiness status,
 * and payload inspector on the admin detail page.
 *
 * Pure module — no side effects, no I/O.
 */

import type { MtmCanonicalPayload } from './MtmCanonicalSchema';
import {
  isPayloadReadyForCommerce,
  isPayloadReadyForFulfilment,
} from './MtmCanonicalValidator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewReadinessStatus = 'ready' | 'warning' | 'blocked';

export interface ReviewCheckItem {
  /** Machine-readable key for stable references */
  key: string;
  /** Short label shown in the checklist */
  label: string;
  /** Whether this check has passed */
  passed: boolean;
  /** Severity when the check fails */
  severity: 'error' | 'warning' | 'info';
  /** Human-readable detail / remediation hint */
  detail?: string;
}

export interface MtmDesignSnapshot {
  category: string;
  optionSet?: string;
  optionSetVersion?: string;
  selections: Record<string, string>;
  pricingTotal?: number;
  pricingBreakdown?: Array<{ key: string; label: string; amount: number }>;
  fabricCode?: string;
  fabricName?: string;
  isValid?: boolean;
  validationErrors?: string[];
}

export interface MtmFitSnapshot {
  email: string;
  fitPreference?: string;
  fitProfileId?: string;
  bookingId?: string;
  jacketSize?: number;
  trouserSize?: number;
  appointmentDate?: string;
  appointmentTime?: string;
  measurements: Record<string, number>;
}

export interface MtmSpecSnapshot {
  category: string;
  options: Record<string, string>;
  measurements: Record<string, number>;
  fabricCode?: string;
  notes?: string;
  fitGateVersion?: string;
}

export interface MtmOrderReviewSummary {
  /** Unique identifier of the spec/order record */
  orderId: string;
  /** Garment category */
  category: string;
  /** Payload schema version */
  version: string;
  /** ISO timestamp when the order was created */
  createdAt: string;
  /** Overall readiness for fulfilment */
  readiness: ReviewReadinessStatus;
  /** Design selections and pricing */
  design: MtmDesignSnapshot | null;
  /** Customer fit context */
  fit: MtmFitSnapshot;
  /** Immutable production specification */
  spec: MtmSpecSnapshot;
  /** Reviewer checklist items */
  checklist: ReviewCheckItem[];
  /** Raw canonical payload (kept for payload inspector) */
  rawPayload: MtmCanonicalPayload;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toRecord<V>(value: unknown): Record<string, V> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, V>;
  }
  return {} as Record<string, V>;
}

function extractDesignSnapshot(
  payload: MtmCanonicalPayload,
): MtmDesignSnapshot | null {
  const design = payload.design;
  if (!design) return null;

  return {
    category: design.category ?? payload.category,
    optionSet: design.optionSet ?? undefined,
    optionSetVersion: design.optionSetVersion ?? undefined,
    selections: toRecord<string>(design.selections),
    pricingTotal:
      design.pricing && typeof design.pricing === 'object'
        ? (design.pricing as { total?: number }).total
        : undefined,
    pricingBreakdown:
      design.pricing && typeof design.pricing === 'object'
        ? ((design.pricing as { breakdown?: Array<{ key: string; label: string; amount: number }> })
            .breakdown ?? undefined)
        : undefined,
    fabricCode: payload.mtmSpec?.fabricCode,
    isValid:
      design.validation && typeof design.validation === 'object'
        ? (design.validation as { isValid?: boolean }).isValid ?? true
        : true,
    validationErrors:
      design.validation && typeof design.validation === 'object'
        ? ((design.validation as { errors?: string[] }).errors ?? [])
        : [],
  };
}

function extractFitSnapshot(payload: MtmCanonicalPayload): MtmFitSnapshot {
  const fp = payload.fitProfile;
  const fitContext = payload.fit;
  const measurements: Record<string, number> = {};

  if (fitContext && typeof fitContext === 'object') {
    const ctx = fitContext as Record<string, unknown>;
    const rawMeasurements = ctx.measurements ?? ctx.attributes ?? {};
    if (typeof rawMeasurements === 'object' && rawMeasurements !== null) {
      for (const [k, v] of Object.entries(rawMeasurements as Record<string, unknown>)) {
        if (typeof v === 'number') measurements[k] = v;
      }
    }
  }

  // Fallback: pull measurements from mtmSpec if fit context is absent
  if (Object.keys(measurements).length === 0 && payload.mtmSpec?.measurements) {
    Object.assign(measurements, payload.mtmSpec.measurements);
  }

  return {
    email: fp.email,
    fitPreference: fp.fitPreference ?? undefined,
    fitProfileId: fp.fitProfileId ?? undefined,
    bookingId: fp.bookingId ?? undefined,
    jacketSize: fp.jacketSize ?? undefined,
    trouserSize: fp.trouserSize ?? undefined,
    appointmentDate: fp.appointmentDate ?? undefined,
    appointmentTime: fp.appointmentTime ?? undefined,
    measurements,
  };
}

function extractSpecSnapshot(payload: MtmCanonicalPayload): MtmSpecSnapshot {
  const s = payload.mtmSpec;
  return {
    category: s.category,
    options: toRecord<string>(s.options),
    measurements: toRecord<number>(s.measurements),
    fabricCode: s.fabricCode ?? undefined,
    notes: s.notes ?? undefined,
    fitGateVersion: s.fitGateVersion ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Checklist builder
// ---------------------------------------------------------------------------

function buildChecklist(payload: MtmCanonicalPayload): ReviewCheckItem[] {
  const items: ReviewCheckItem[] = [];

  // 1. Category present
  items.push({
    key: 'category_present',
    label: 'Garment category set',
    passed: !!payload.category,
    severity: 'error',
    detail: payload.category
      ? `Category: ${payload.category}`
      : 'No category found in payload',
  });

  // 2. Fit profile email
  items.push({
    key: 'fit_profile_email',
    label: 'Customer email captured',
    passed: !!payload.fitProfile?.email,
    severity: 'error',
    detail: payload.fitProfile?.email
      ? undefined
      : 'Fit profile is missing customer email',
  });

  // 3. Fit profile ID linked
  items.push({
    key: 'fit_profile_id',
    label: 'Fit profile ID linked',
    passed: !!payload.fitProfile?.fitProfileId,
    severity: 'warning',
    detail: payload.fitProfile?.fitProfileId
      ? `Profile ID: ${payload.fitProfile.fitProfileId}`
      : 'No fitProfileId — cannot link to profile record',
  });

  // 4. Appointment scheduled
  items.push({
    key: 'appointment_booked',
    label: 'Appointment date and time recorded',
    passed: !!(payload.fitProfile?.appointmentDate),
    severity: 'warning',
    detail: payload.fitProfile?.appointmentDate
      ? `${payload.fitProfile.appointmentDate} ${payload.fitProfile.appointmentTime ?? ''}`.trim()
      : 'No appointment date on record',
  });

  // 5. Design snapshot present
  items.push({
    key: 'design_snapshot',
    label: 'Design snapshot captured',
    passed: !!payload.design,
    severity: 'warning',
    detail: payload.design ? undefined : 'No design snapshot — configurator step may have been skipped',
  });

  // 6. Design validation passed
  const designValidation =
    payload.design && typeof payload.design === 'object'
      ? (payload.design as Record<string, unknown>).validation
      : undefined;
  const designIsValid =
    !designValidation ||
    (typeof designValidation === 'object' &&
      (designValidation as Record<string, unknown>).isValid !== false);

  items.push({
    key: 'design_valid',
    label: 'Design configuration valid',
    passed: designIsValid,
    severity: 'error',
    detail: designIsValid
      ? undefined
      : `Design validation failed: ${JSON.stringify(
          (designValidation as Record<string, unknown>).errors ?? [],
        )}`,
  });

  // 7. Measurements present
  const measurementCount = Object.keys(payload.mtmSpec?.measurements ?? {}).length;
  items.push({
    key: 'measurements_present',
    label: 'Anatomy measurements recorded',
    passed: measurementCount > 0,
    severity: 'error',
    detail: measurementCount > 0
      ? `${measurementCount} measurement(s) on file`
      : 'No measurements found — cannot produce specification',
  });

  // 8. MTM spec options provided
  const optionCount = Object.keys(payload.mtmSpec?.options ?? {}).length;
  items.push({
    key: 'spec_options',
    label: 'MTM spec options captured',
    passed: optionCount > 0,
    severity: 'warning',
    detail: optionCount > 0
      ? `${optionCount} option(s) specified`
      : 'No options in MTM spec',
  });

  // 9. Fabric code present
  items.push({
    key: 'fabric_code',
    label: 'Fabric reference recorded',
    passed: !!payload.mtmSpec?.fabricCode,
    severity: 'warning',
    detail: payload.mtmSpec?.fabricCode
      ? `Fabric: ${payload.mtmSpec.fabricCode}`
      : 'No fabric code — confirm fabric selection before handoff',
  });

  // 10. Commerce-ready (A14 composite check)
  items.push({
    key: 'ready_for_commerce',
    label: 'Payload ready for commerce',
    passed: isPayloadReadyForCommerce(payload),
    severity: 'error',
    detail: isPayloadReadyForCommerce(payload)
      ? undefined
      : 'Payload fails commerce readiness check (requires fitProfile + design + mtmSpec)',
  });

  // 11. Fulfilment-ready (A14 composite check)
  items.push({
    key: 'ready_for_fulfilment',
    label: 'Payload ready for fulfilment',
    passed: isPayloadReadyForFulfilment(payload),
    severity: 'error',
    detail: isPayloadReadyForFulfilment(payload)
      ? undefined
      : 'Payload fails fulfilment readiness check (requires fitProfileId + category + measurements)',
  });

  return items;
}

// ---------------------------------------------------------------------------
// Readiness resolver
// ---------------------------------------------------------------------------

function resolveReadiness(checklist: ReviewCheckItem[]): ReviewReadinessStatus {
  const hasError = checklist.some((c) => !c.passed && c.severity === 'error');
  if (hasError) return 'blocked';
  const hasWarning = checklist.some((c) => !c.passed && c.severity === 'warning');
  if (hasWarning) return 'warning';
  return 'ready';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a structured review summary from a canonical MTM payload.
 *
 * @param orderId  Unique identifier (ProductionSpec.id or orderId)
 * @param payload  Raw canonical payload stored in ProductionSpec.spec
 */
export function buildOrderReviewSummary(
  orderId: string,
  payload: MtmCanonicalPayload,
): MtmOrderReviewSummary {
  const checklist = buildChecklist(payload);
  const readiness = resolveReadiness(checklist);

  return {
    orderId,
    category: payload.category,
    version: payload.version ?? 'v1',
    createdAt: payload.createdAt,
    readiness,
    design: extractDesignSnapshot(payload),
    fit: extractFitSnapshot(payload),
    spec: extractSpecSnapshot(payload),
    checklist,
    rawPayload: payload,
  };
}

/**
 * Returns a badge label and colour hint for a given readiness status.
 */
export function readinessLabel(status: ReviewReadinessStatus): {
  label: string;
  colour: 'green' | 'amber' | 'red';
} {
  switch (status) {
    case 'ready':
      return { label: 'Ready', colour: 'green' };
    case 'warning':
      return { label: 'Review Required', colour: 'amber' };
    case 'blocked':
      return { label: 'Blocked', colour: 'red' };
  }
}
