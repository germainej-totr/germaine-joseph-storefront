import type { MtmCategory } from '@/types/mtm';

export interface BuildCategoryCartPayloadInput {
  category: MtmCategory;
  optionSet: string;
  optionSetVersion: string;
  selections: Record<string, string>;
  designUpcharge: number;
  fitProfileId?: string;
  fitGateVersion?: string;
  fabricId?: string;
  email: string;
  fitPreference: string;
  appointmentDate: string;
  appointmentTime: string;
  attributes: Record<string, string>;
}

export interface BuildCategoryCartPayloadOutput {
  canonicalPayload: Record<string, unknown>;
  lineItemAttributes: Record<string, string>;
}

export function extractNumericMeasurements(attributes: Record<string, string>): Record<string, number> {
  const keys = ['chest', 'stomach', 'waist', 'hips', 'height', 'weight'];
  const result: Record<string, number> = {};

  for (const key of keys) {
    const raw = attributes[key];
    if (!raw) continue;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      result[key] = parsed;
    }
  }

  return result;
}

export function buildCategoryCartPayload(
  input: BuildCategoryCartPayloadInput,
): BuildCategoryCartPayloadOutput {
  const measurements = extractNumericMeasurements(input.attributes);

  const canonicalPayload: Record<string, unknown> = {
    version: 'v1',
    category: input.category,
    createdAt: new Date().toISOString(),
    fitProfile: {
      email: input.email,
      fitPreference: input.fitPreference,
      fitProfileId: input.fitProfileId,
      appointmentDate: input.appointmentDate,
      appointmentTime: input.appointmentTime,
      fitGateVersion: input.fitGateVersion || input.optionSetVersion,
    },
    design: {
      category: input.category,
      optionSet: input.optionSet,
      optionSetVersion: input.optionSetVersion,
      selections: input.selections,
      pricing: {
        total: input.designUpcharge,
      },
      validation: {
        isValid: true,
      },
    },
    mtmSpec: {
      category: input.category,
      fabricCode: input.fabricId,
      options: input.selections,
      measurements,
      fitGateVersion: input.fitGateVersion || input.optionSetVersion,
      fitProfileId: input.fitProfileId,
    },
  };

  const lineItemAttributes: Record<string, string> = {
    gjm_mtm_category: input.category,
    gjm_mtm_option_set: input.optionSet,
    gjm_mtm_option_set_version: input.optionSetVersion,
    [`gjm_${input.category}_selections`]: JSON.stringify(input.selections),
    gjm_design_pricing_total: String(input.designUpcharge),
    gjm_fit_email: input.email,
    gjm_fit_preference: input.fitPreference,
    gjm_fit_appointment_date: input.appointmentDate,
    gjm_fit_appointment_time: input.appointmentTime,
    gjm_mtm_canonical: JSON.stringify(canonicalPayload),
    gjm_mtm_spec: JSON.stringify(canonicalPayload.mtmSpec || {}),
    gjm_mtm_options: JSON.stringify(input.selections),
    gjm_measurements: JSON.stringify(measurements),
  };

  if (input.fitProfileId) {
    lineItemAttributes.gjm_fit_profile_id = input.fitProfileId;
    lineItemAttributes.fit_profile_id = input.fitProfileId;
  }

  if (input.fitGateVersion) {
    lineItemAttributes.gjm_fit_gate_version = input.fitGateVersion;
    lineItemAttributes.fit_gate_version = input.fitGateVersion;
  }

  if (input.fabricId) {
    lineItemAttributes.gjm_fabric_id = input.fabricId;
  }

  return { canonicalPayload, lineItemAttributes };
}
