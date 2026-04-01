import { allSuitOptionSets, type SuitVariant } from '@/types/suitOptions';
import type { MtmOptionSet } from '@/types/trouserOptions';
import type { SuitSelections } from '@/lib/suit/SuitOptionVisibility';

export interface DraftSuitDesign {
  timestamp: number;
  variant: SuitVariant;
  payload: {
    selections: SuitSelections;
    fabricId?: string;
  };
}

const DRAFT_SUIT_KEY = 'gj:draft:suit:design';

export function loadDraftSuitDesign(): DraftSuitDesign | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(DRAFT_SUIT_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as DraftSuitDesign;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraftSuitDesign(
  variant: SuitVariant,
  selections: SuitSelections,
  fabricId?: string,
): void {
  if (typeof window === 'undefined') return;

  const draft: DraftSuitDesign = {
    timestamp: Date.now(),
    variant,
    payload: {
      selections,
      fabricId,
    },
  };

  try {
    localStorage.setItem(DRAFT_SUIT_KEY, JSON.stringify(draft));
  } catch {
    // Storage quota exceeded or localStorage unavailable
    console.warn('Failed to save suit draft design');
  }
}

export function clearDraftSuitDesign(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(DRAFT_SUIT_KEY);
  } catch {
    console.warn('Failed to clear suit draft design');
  }
}

export function mapToCartAttributes(
  variant: SuitVariant,
  selections: SuitSelections,
  optionSet: MtmOptionSet = allSuitOptionSets[variant],
): Record<string, string> {
  return {
    _suit_variant: variant,
    _suit_options: JSON.stringify(selections),
    _suit_config_version: optionSet.version,
  };
}
