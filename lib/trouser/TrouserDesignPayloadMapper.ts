import { trouserOptionSet, type MtmOptionSet } from '@/types/trouserOptions';
import { normalizeTrouserSelections } from '@/lib/trouser/TrouserSelectionNormalizer';
import { validateTrouserSelections, type TrouserValidationResult } from '@/lib/trouser/TrouserOptionValidation';
import { calculateTrouserPrice } from '@/lib/trouser/TrouserPriceCalculator';

export type TrouserSelections = Record<string, string | undefined>;

export interface TrouserDesignPayload {
  category: 'trouser';
  optionSet: string;
  optionSetVersion: string;
  selections: Record<string, string>;
  /** Selected fabric id from the A16 fabric catalogue (optional until chosen) */
  fabricId?: string;
  /** Human-readable snapshot of chosen fabric for display */
  fabricName?: string;
  pricing: {
    totalDesignUpcharge: number;
    breakdown: Array<{
      key: string;
      optionLabel: string;
      choiceLabel: string;
      amount: number;
    }>;
  };
  validation: TrouserValidationResult;
}

export function mapTrouserDesignPayload(
  rawSelections: TrouserSelections,
  optionSet: MtmOptionSet = trouserOptionSet,
  fabric?: { id: string; name: string } | null,
): TrouserDesignPayload {
  const normalized = normalizeTrouserSelections(rawSelections, optionSet);
  const validation = validateTrouserSelections(normalized.selections, optionSet);
  const pricing = calculateTrouserPrice(normalized.selections, optionSet);

  const selections: Record<string, string> = {};
  for (const [key, value] of Object.entries(normalized.selections)) {
    if (value) selections[key] = value;
  }

  return {
    category: 'trouser',
    optionSet: optionSet.handle,
    optionSetVersion: optionSet.version,
    selections,
    fabricId: fabric?.id,
    fabricName: fabric?.name,
    pricing: {
      totalDesignUpcharge: pricing.total,
      breakdown: pricing.breakdown,
    },
    validation,
  };
}
