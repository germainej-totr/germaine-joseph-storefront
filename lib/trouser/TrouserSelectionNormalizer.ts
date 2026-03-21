import { trouserOptionSet, type MtmOptionSet } from '@/types/trouserOptions';
import { applyStyleDefaults } from '@/lib/trouser/TrouserOptionDefaults';
import {
  getVisibleOptions,
  removeHiddenSelections,
  sanitizeInvalidChoiceValues,
} from '@/lib/trouser/TrouserOptionVisibility';

export type TrouserSelections = Record<string, string | undefined>;

export interface NormalizedTrouserSelectionsResult {
  selections: TrouserSelections;
  visibleKeys: string[];
  defaultedKeys: string[];
}

export function normalizeTrouserSelections(
  selections: TrouserSelections,
  optionSet: MtmOptionSet = trouserOptionSet,
): NormalizedTrouserSelectionsResult {
  // 1) remove unknown choice values first
  const choiceSanitized = sanitizeInvalidChoiceValues(selections, optionSet);

  // 2) remove hidden values based on current style + dependsOn
  const hiddenCleaned = removeHiddenSelections(choiceSanitized, optionSet);

  // 3) apply style defaults for unselected visible keys
  const withDefaults = applyStyleDefaults(hiddenCleaned, optionSet);

  // 4) remove hidden again (defaults can introduce now-hidden fields if style changed)
  const finalSelections = removeHiddenSelections(withDefaults, optionSet);

  // 5) apply first choice fallback for missing required visible fields
  const visible = getVisibleOptions(finalSelections, optionSet);
  const next: TrouserSelections = { ...finalSelections };
  const defaultedKeys: string[] = [];

  for (const option of visible) {
    if (!option.required || next[option.key]) continue;
    const firstChoice = option.choices?.[0]?.value;
    if (firstChoice) {
      next[option.key] = firstChoice;
      defaultedKeys.push(option.key);
    }
  }

  return {
    selections: next,
    visibleKeys: visible.map((o) => o.key),
    defaultedKeys,
  };
}
