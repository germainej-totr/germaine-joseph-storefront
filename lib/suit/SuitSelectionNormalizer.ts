import { allSuitOptionSets } from '@/types/suitOptions';
import type { MtmOptionSet } from '@/types/trouserOptions';
import { getVisibleSuitOptions } from '@/lib/suit/SuitOptionVisibility';
import type { SuitSelections } from '@/lib/suit/SuitOptionVisibility';

/**
 * Normalize suit selections by filtering out values for hidden (non-visible) options.
 * This ensures that the suit selection stays in sync when visibility rules change.
 */
export function normalizeSuitSelections(
  selections: SuitSelections,
  optionSet: MtmOptionSet = allSuitOptionSets.business,
): { selections: SuitSelections; removedKeys: string[] } {
  const visible = getVisibleSuitOptions(selections, optionSet);
  const visibleKeys = new Set(visible.map((o) => o.key));

  const normalized: SuitSelections = {};
  const removedKeys: string[] = [];

  for (const [key, value] of Object.entries(selections)) {
    if (visibleKeys.has(key)) {
      normalized[key] = value;
    } else if (value !== undefined) {
      removedKeys.push(key);
    }
  }

  return { selections: normalized, removedKeys };
}
