import { allSuitOptionSets } from '@/types/suitOptions';
import type { MtmOptionSet } from '@/types/trouserOptions';
import { getVisibleSuitOptions } from '@/lib/suit/SuitOptionVisibility';
import type { SuitSelections } from '@/lib/suit/SuitOptionVisibility';

export interface SuitPriceLine {
  key: string;
  optionLabel: string;
  choiceLabel: string;
  amount: number;
}

export interface SuitPriceResult {
  total: number;
  breakdown: SuitPriceLine[];
}

export function calculateSuitPrice(
  selections: SuitSelections,
  optionSet: MtmOptionSet = allSuitOptionSets.business,
): SuitPriceResult {
  const visible = getVisibleSuitOptions(selections, optionSet);
  const breakdown: SuitPriceLine[] = [];

  for (const option of visible) {
    const value = selections[option.key];
    if (!value || !option.choices) continue;

    const selectedChoice = option.choices.find((choice) => choice.value === value);
    if (!selectedChoice) continue;

    const amount = selectedChoice.priceDelta ?? 0;
    if (amount <= 0) continue;

    breakdown.push({
      key: option.key,
      optionLabel: option.label,
      choiceLabel: selectedChoice.label,
      amount,
    });
  }

  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
  return { total, breakdown };
}
