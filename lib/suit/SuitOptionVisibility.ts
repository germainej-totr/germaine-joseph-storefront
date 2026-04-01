import { type SuitVariant, allSuitOptionSets } from '@/types/suitOptions';
import type { MtmOption, MtmOptionSet } from '@/types/trouserOptions';

export type SuitSelections = Record<string, string | undefined>;

export function getVisibleSuitOptions(
  selections: SuitSelections,
  optionSet: MtmOptionSet,
): MtmOption[] {
  const visible: MtmOption[] = [];

  for (const option of optionSet.options) {
    // Check if option has dependsOn rules
    if (option.dependsOn) {
      let shouldShow = true;
      for (const [dependency, requiredValue] of Object.entries(option.dependsOn)) {
        const actualValue = selections[dependency];
        const valueMatches = Array.isArray(requiredValue)
          ? actualValue !== undefined && requiredValue.includes(actualValue)
          : actualValue === requiredValue;

        if (!valueMatches) {
          shouldShow = false;
          break;
        }
      }

      if (!shouldShow) continue;
    }

    visible.push(option);
  }

  return visible;
}

export function isOptionVisible(
  option: MtmOption,
  selections: SuitSelections,
): boolean {
  if (!option.dependsOn) return true;

  for (const [dependency, requiredValue] of Object.entries(option.dependsOn)) {
    const actualValue = selections[dependency];
    const valueMatches = Array.isArray(requiredValue)
      ? actualValue !== undefined && requiredValue.includes(actualValue)
      : actualValue === requiredValue;

    if (!valueMatches) return false;
  }

  return true;
}

/**
 * Export option sets by variant for access in controllers
 */
export function getSuitOptionSetByVariant(variant: SuitVariant): MtmOptionSet {
  return allSuitOptionSets[variant];
}
