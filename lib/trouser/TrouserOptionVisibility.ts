import {
  isOptionVisible,
  trouserOptionSet,
  type MtmOption,
  type MtmOptionSet,
} from '@/types/trouserOptions';

export type TrouserSelections = Record<string, string | undefined>;

// Explicit style-driven resets beyond schema dependsOn.
const STYLE_FORCED_HIDDEN_KEYS: Record<string, string[]> = {
  jeans: ['front_style', 'waistband', 'fastening', 'lining', 'tuxedo_contrast'],
  drawstring: ['waistband', 'tuxedo_contrast'],
};

export function getStyleForcedHiddenKeys(style?: string): string[] {
  if (!style) return [];
  return STYLE_FORCED_HIDDEN_KEYS[style] ?? [];
}

export function getVisibleOptions(
  selections: TrouserSelections,
  optionSet: MtmOptionSet = trouserOptionSet,
): MtmOption[] {
  const sorted = [...optionSet.options].sort((a, b) => a.sortOrder - b.sortOrder);
  const forcedHidden = new Set(getStyleForcedHiddenKeys(selections.style));

  return sorted.filter((option) => {
    if (forcedHidden.has(option.key)) return false;
    return isOptionVisible(option, selections);
  });
}

export function removeHiddenSelections(
  selections: TrouserSelections,
  optionSet: MtmOptionSet = trouserOptionSet,
): TrouserSelections {
  const visible = getVisibleOptions(selections, optionSet);
  const visibleKeys = new Set(visible.map((o) => o.key));
  const next: TrouserSelections = {};

  for (const [key, value] of Object.entries(selections)) {
    if (!value) continue;
    if (visibleKeys.has(key)) {
      next[key] = value;
    }
  }

  return next;
}

export function sanitizeInvalidChoiceValues(
  selections: TrouserSelections,
  optionSet: MtmOptionSet = trouserOptionSet,
): TrouserSelections {
  const next: TrouserSelections = {};

  for (const [key, value] of Object.entries(selections)) {
    if (!value) continue;
    const option = optionSet.options.find((o) => o.key === key);
    if (!option?.choices) continue;
    if (option.choices.some((choice) => choice.value === value)) {
      next[key] = value;
    }
  }

  return next;
}
