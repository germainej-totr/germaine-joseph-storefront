import { trouserOptionSet, type MtmOptionSet } from '@/types/trouserOptions';
import { getVisibleOptions } from '@/lib/trouser/TrouserOptionVisibility';

export type TrouserSelections = Record<string, string | undefined>;

export interface TrouserValidationResult {
  isValid: boolean;
  missingRequiredKeys: string[];
  invalidValueKeys: string[];
  invalidCombinationRules: string[];
}

function hasChoiceValue(optionSet: MtmOptionSet, key: string, value?: string): boolean {
  if (!value) return false;
  const option = optionSet.options.find((o) => o.key === key);
  return !!option?.choices?.some((c) => c.value === value);
}

export function validateTrouserSelections(
  selections: TrouserSelections,
  optionSet: MtmOptionSet = trouserOptionSet,
): TrouserValidationResult {
  const visible = getVisibleOptions(selections, optionSet);
  const visibleKeys = new Set(visible.map((o) => o.key));

  const missingRequiredKeys = visible
    .filter((option) => option.required && !selections[option.key])
    .map((option) => option.key);

  const invalidValueKeys: string[] = [];
  for (const [key, value] of Object.entries(selections)) {
    if (!value) continue;

    const option = optionSet.options.find((o) => o.key === key);
    if (!option) {
      invalidValueKeys.push(key);
      continue;
    }

    // Selected value for hidden key is invalid stale state.
    if (!visibleKeys.has(key)) {
      invalidValueKeys.push(key);
      continue;
    }

    if (!hasChoiceValue(optionSet, key, value)) {
      invalidValueKeys.push(key);
    }
  }

  const invalidCombinationRules: string[] = [];
  const style = selections.style;

  if (style !== 'dress_pants' && selections.tuxedo_contrast) {
    invalidCombinationRules.push('tuxedo_contrast_requires_dress_pants');
  }

  if (style === 'jeans' && selections.lining) {
    invalidCombinationRules.push('lining_not_valid_for_jeans');
  }

  if (style === 'drawstring' && selections.waistband === 'gurkha') {
    invalidCombinationRules.push('gurkha_waistband_not_valid_for_drawstring');
  }

  if (style === 'jeans' && selections.front_style === 'double_pleats_decorative_flap_pocket') {
    invalidCombinationRules.push('decorative_flap_pleats_not_valid_for_jeans');
  }

  const isValid =
    missingRequiredKeys.length === 0 &&
    invalidValueKeys.length === 0 &&
    invalidCombinationRules.length === 0;

  return {
    isValid,
    missingRequiredKeys,
    invalidValueKeys,
    invalidCombinationRules,
  };
}
