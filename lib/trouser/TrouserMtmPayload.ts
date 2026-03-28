import type { MtmLineItemProperties, MtmSpec } from '@/types/mtm';
import { mapToCartAttributes } from '@/lib/trouser/TrouserDesignPersistence';
import type { ContinueToFitSnapshot } from '@/lib/trouser/FitHandoffStorage';

type FitAttributes = Record<string, unknown>;
type FitPreferences = Record<string, unknown>;

interface BuildTrouserMtmPayloadInput {
  email: string;
  fitPreference: string;
  jacketSize: number;
  trouserSize: number;
  appointmentDate: string;
  appointmentTime: string;
  fitProfileId?: string;
  bookingId?: string;
  attributes: FitAttributes;
  preferences: FitPreferences;
  jacketSpecs: Record<string, unknown>;
  trouserSpecs: Record<string, unknown>;
  trouserDesign: ContinueToFitSnapshot | null;
}

export interface CanonicalTrouserMtmPayload {
  category: 'trouser';
  createdAt: string;
  fitProfile: {
    email: string;
    fitPreference: string;
    jacketSize: number;
    trouserSize: number;
    appointmentDate: string;
    appointmentTime: string;
    fitProfileId?: string;
    bookingId?: string;
  };
  design: ContinueToFitSnapshot | null;
  fit: {
    attributes: FitAttributes;
    preferences: FitPreferences;
    jacketSpecs: Record<string, unknown>;
    trouserSpecs: Record<string, unknown>;
  };
  mtmSpec: MtmSpec;
  lineItemProperties: Partial<MtmLineItemProperties> & Record<string, string>;
}

function asFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : (value as number);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function pickMeasurements(attributes: FitAttributes): Record<string, number> {
  const keys = ['chest', 'stomach', 'waist', 'hips', 'height', 'weight'];
  const result: Record<string, number> = {};

  for (const key of keys) {
    const value = asFiniteNumber(attributes[key]);
    if (value === null) continue;
    result[key] = value;
  }

  return result;
}

function buildLineItemProperties(
  payload: CanonicalTrouserMtmPayload,
): Partial<MtmLineItemProperties> & Record<string, string> {
  const base: Partial<MtmLineItemProperties> & Record<string, string> = {
    mtm_category: payload.category,
    gjm_mtm_category: payload.category,
    mtm_spec: JSON.stringify(payload.mtmSpec),
    gjm_mtm_spec: JSON.stringify(payload.mtmSpec),
    mtm_options: JSON.stringify(payload.design?.selections || {}),
    gjm_mtm_options: JSON.stringify(payload.design?.selections || {}),
    measurements: JSON.stringify(payload.mtmSpec.measurements),
    gjm_measurements: JSON.stringify(payload.mtmSpec.measurements),
    fit_gate_version: payload.design?.optionSetVersion || 'fit-gate-v1',
    gjm_fit_gate_version: payload.design?.optionSetVersion || 'fit-gate-v1',
  };

  const fitProfileId = payload.fitProfile.fitProfileId || payload.fitProfile.bookingId;
  if (fitProfileId) {
    base.fit_profile_id = fitProfileId;
    base.gjm_fit_profile_id = fitProfileId;
  }

  if (payload.design) {
    return {
      ...base,
      ...mapToCartAttributes({
        category: payload.design.category,
        optionSet: payload.design.optionSet,
        optionSetVersion: payload.design.optionSetVersion,
        selections: payload.design.selections,
        pricing: {
          totalDesignUpcharge: payload.design.pricing.total,
          breakdown: payload.design.pricing.breakdown.map((item) => ({
            key: item.key,
            optionLabel: item.label,
            choiceLabel: item.label,
            amount: item.amount,
          })),
        },
        validation: {
          isValid: payload.design.validation.isValid,
          missingRequiredKeys: [],
          invalidValueKeys: [],
          invalidCombinationRules: payload.design.validation.errors,
        },
      }),
      gjm_mtm_canonical: JSON.stringify(payload),
    };
  }

  return {
    ...base,
    gjm_mtm_canonical: JSON.stringify(payload),
  };
}

export function buildCanonicalTrouserMtmPayload(
  input: BuildTrouserMtmPayloadInput,
): CanonicalTrouserMtmPayload {
  const createdAt = new Date().toISOString();

  const mtmSpec: MtmSpec = {
    category: 'trouser',
    options: input.trouserDesign?.selections || {},
    measurements: pickMeasurements(input.attributes),
    notes: `FitPreference=${input.fitPreference}; Appointment=${input.appointmentDate} ${input.appointmentTime}`,
    fitGateVersion: input.trouserDesign?.optionSetVersion || 'fit-gate-v1',
    fitProfileId: input.fitProfileId || input.bookingId,
  };

  const canonical: CanonicalTrouserMtmPayload = {
    category: 'trouser',
    createdAt,
    fitProfile: {
      email: input.email,
      fitPreference: input.fitPreference,
      jacketSize: input.jacketSize,
      trouserSize: input.trouserSize,
      appointmentDate: input.appointmentDate,
      appointmentTime: input.appointmentTime,
      fitProfileId: input.fitProfileId,
      bookingId: input.bookingId,
    },
    design: input.trouserDesign,
    fit: {
      attributes: input.attributes,
      preferences: input.preferences,
      jacketSpecs: input.jacketSpecs,
      trouserSpecs: input.trouserSpecs,
    },
    mtmSpec,
    lineItemProperties: {},
  };

  canonical.lineItemProperties = buildLineItemProperties(canonical);
  return canonical;
}
