import { allSuitOptionSets, type SuitVariant } from '@/types/suitOptions';
import type { SuitSelections } from '@/lib/suit/SuitOptionVisibility';
import type { MtmCanonicalPayload, MtmSpec } from '@/types/mtm';

export interface SuitDesignPayload {
  variant: SuitVariant;
  selections: SuitSelections;
  fabricId?: string;
}

/**
 * Map a suit design (variant + selections) into an MTM specification.
 */
export function mapSuitDesignToMtmSpec(
  input: SuitDesignPayload,
  measurements: Record<string, number> = {},
  fitProfileId?: string,
): MtmSpec {
  const { variant, selections, fabricId } = input;

  // Filter out undefined values from selections
  const cleanSelections: Record<string, string> = {};
  for (const [key, value] of Object.entries(selections)) {
    if (value !== undefined) {
      cleanSelections[key] = value;
    }
  }

  return {
    category: 'suit',
    options: cleanSelections,
    measurements,
    fabricCode: fabricId,
    fitProfileId,
    notes: `${variant.charAt(0).toUpperCase() + variant.slice(1)} Suit`,
  };
}

/**
 * Build a complete canonical MTM payload for suit cart addition.
 * Includes measurements from fit profile and selections from configurator.
 */
export function buildCanonicalSuitMtmPayload(
  designPayload: SuitDesignPayload,
  measurements: Record<string, number> = {},
  fitProfile?: {
    email: string;
    fitPreference: string;
    fitProfileId?: string;
  },
  fitGateVersion?: string,
): Partial<MtmCanonicalPayload> {
  const { variant, selections } = designPayload;
  const optionSet = allSuitOptionSets[variant];

  // Filter out undefined values from selections
  const cleanSelections: Record<string, string> = {};
  for (const [key, value] of Object.entries(selections)) {
    if (value !== undefined) {
      cleanSelections[key] = value;
    }
  }

  return {
    category: 'suit',
    fitProfile: {
      email: fitProfile?.email || '',
      fitPreference: fitProfile?.fitPreference || '',
      fitProfileId: fitProfile?.fitProfileId,
      fitGateVersion,
    },
    design: {
      category: 'suit',
      optionSet: optionSet.id,
      optionSetVersion: optionSet.version,
      selections: cleanSelections,
      pricing: {
        total: 0, // Should be calculated separately
      },
    },
    mtmSpec: mapSuitDesignToMtmSpec(designPayload, measurements, fitProfile?.fitProfileId),
  };
}
