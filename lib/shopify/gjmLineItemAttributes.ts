import type { MtmSpec } from '@/types/mtm';

export type ShopifyAttributeInput = Array<{ key: string; value: string }>;

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

export function normalizeGjmLineItemAttributes(input: {
  fitProfileId?: string;
  fitGateVersion?: string;
  mtmSpec?: MtmSpec;
  mtmOptions?: Record<string, string>;
  measurements?: Record<string, number>;
  customAttributes?: Record<string, string>;
}): Record<string, string> {
  const normalized: Record<string, string> = {
    ...(input.customAttributes || {}),
  };

  const fitProfileId =
    input.fitProfileId ||
    normalized.gjm_fit_profile_id ||
    normalized.fit_profile_id ||
    '';

  if (fitProfileId) {
    normalized.fit_profile_id = fitProfileId;
    normalized.gjm_fit_profile_id = fitProfileId;
  }

  const fitGateVersion = input.fitGateVersion || normalized.gjm_fit_gate_version || normalized.fit_gate_version || '';
  if (fitGateVersion) {
    normalized.fit_gate_version = fitGateVersion;
    normalized.gjm_fit_gate_version = fitGateVersion;
  }

  const mtmSpec = input.mtmSpec;
  if (mtmSpec) {
    const serializedSpec = safeStringify(mtmSpec);
    normalized.mtm_spec = serializedSpec;
    normalized.gjm_mtm_spec = serializedSpec;

    const mtmCategory = normalized.gjm_mtm_category || normalized.mtm_category || mtmSpec.category;
    if (mtmCategory) {
      normalized.mtm_category = mtmCategory;
      normalized.gjm_mtm_category = mtmCategory;
    }

    const derivedMeasurements = input.measurements || mtmSpec.measurements;
    if (derivedMeasurements && Object.keys(derivedMeasurements).length > 0) {
      const serializedMeasurements = safeStringify(derivedMeasurements);
      normalized.measurements = serializedMeasurements;
      normalized.gjm_measurements = serializedMeasurements;
    }

    const derivedOptions = input.mtmOptions || mtmSpec.options;
    if (derivedOptions && Object.keys(derivedOptions).length > 0) {
      const serializedOptions = safeStringify(derivedOptions);
      normalized.mtm_options = serializedOptions;
      normalized.gjm_mtm_options = serializedOptions;
    }

    if (!normalized.gjm_mtm_canonical) {
      normalized.gjm_mtm_canonical = serializedSpec;
    }
  }

  if (input.measurements && Object.keys(input.measurements).length > 0) {
    const serializedMeasurements = safeStringify(input.measurements);
    normalized.measurements = serializedMeasurements;
    normalized.gjm_measurements = serializedMeasurements;
  }

  if (input.mtmOptions && Object.keys(input.mtmOptions).length > 0) {
    const serializedOptions = safeStringify(input.mtmOptions);
    normalized.mtm_options = serializedOptions;
    normalized.gjm_mtm_options = serializedOptions;
  }

  if (normalized._mtm_canonical_payload && !normalized.gjm_mtm_canonical) {
    normalized.gjm_mtm_canonical = normalized._mtm_canonical_payload;
  }

  delete normalized._mtm_canonical_payload;

  return normalized;
}

export function toShopifyAttributeInput(attributes: Record<string, string>): ShopifyAttributeInput {
  return Object.entries(attributes).map(([key, value]) => ({ key, value }));
}