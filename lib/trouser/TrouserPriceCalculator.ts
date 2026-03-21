import { trouserOptionSet, type MtmOptionSet } from '@/types/trouserOptions';
import { getVisibleOptions } from '@/lib/trouser/TrouserOptionVisibility';

export type TrouserSelections = Record<string, string | undefined>;

export interface TrouserPriceLine {
  key: string;
  optionLabel: string;
  choiceLabel: string;
  amount: number;
}

export interface TrouserPriceResult {
  total: number;
  breakdown: TrouserPriceLine[];
}

export function calculateTrouserPrice(
  selections: TrouserSelections,
  optionSet: MtmOptionSet = trouserOptionSet,
): TrouserPriceResult {
  const visible = getVisibleOptions(selections, optionSet);
  const breakdown: TrouserPriceLine[] = [];

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
