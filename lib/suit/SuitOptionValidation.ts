import { allSuitOptionSets } from '@/types/suitOptions';
import type { MtmOptionSet } from '@/types/trouserOptions';
import { getVisibleSuitOptions } from '@/lib/suit/SuitOptionVisibility';
import type { SuitSelections } from '@/lib/suit/SuitOptionVisibility';

export type SuitValidationResult = {
  isValid: boolean;
  missingRequiredKeys: string[];
  invalidValueKeys: string[];
  invalidCombinationRules: string[];
};

function hasChoiceValue(optionSet: MtmOptionSet, key: string, value?: string): boolean {
  if (!value) return false;
  const option = optionSet.options.find((o) => o.key === key);
  return !!option?.choices?.some((c) => c.value === value);
}

export function validateSuitSelections(
  selections: SuitSelections,
  optionSet: MtmOptionSet = allSuitOptionSets.business,
): SuitValidationResult {
  const visible = getVisibleSuitOptions(selections, optionSet);
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

  // Business suit specific rules
  if (optionSet.id === 'suit-business-v1') {
    const trouserStyle = selections.trouser_style;
    if (trouserStyle === 'jeans' || trouserStyle === 'shorts') {
      invalidCombinationRules.push('jeans_shorts_not_valid_for_business_suit');
    }
  }

  // Wedding suit specific rules
  if (optionSet.id === 'suit-wedding-v1') {
    const trouserStyle = selections.trouser_style;
    if (!trouserStyle || !['dress_pants', 'dress_pants_pleated', 'wool_blend'].includes(trouserStyle)) {
      invalidCombinationRules.push('wedding_requires_dress_trousers');
    }
  }

  // Casual suit specific rules - double breasted requires special handling
  if (optionSet.id === 'suit-casual-v1') {
    const jacketStyle = selections.button_count;
    if (jacketStyle === 'double_breasted') {
      // Double breasted looks better without ticket pocket
      if (selections.pocket_style === 'ticket_pocket') {
        invalidCombinationRules.push('double_breasted_with_ticket_pocket_unusual');
      }
    }
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
