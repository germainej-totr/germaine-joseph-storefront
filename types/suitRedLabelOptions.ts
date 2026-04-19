import { SUIT_RED_LABEL_V1_SEED } from '../scripts/data/suit-red-label-v1-seed.mjs';

export type MtmUiHint =
  | 'cards'
  | 'buttons'
  | 'dropdown'
  | 'text'
  | 'hidden'
  | 'accordion';

export type MtmOptionType = 'single' | 'group' | 'text' | 'system';

export type MtmSection =
  | 'jacket_design'
  | 'jacket_interior'
  | 'jacket_details'
  | 'jacket_personalisation'
  | 'trouser_design'
  | 'trouser_details';

export type MtmChoice = {
  value: string;
  label: string;
  priceDelta?: number;
};

export type MtmSelectionValue = string | string[] | undefined;

export type SuitRedLabelSelections = Record<string, MtmSelectionValue>;

export type TopLevelGroupedOption = {
  key: string;
  label: string;
  type: MtmOptionType;
  uiHint: MtmUiHint;
  required: boolean;
  sortOrder: number;
  section: MtmSection;
  choices?: MtmChoice[];
  summaryMode?: 'composite';
};

export type ChildOption = {
  key: string;
  label: string;
  type: MtmOptionType;
  uiHint: MtmUiHint;
  required: boolean;
  choices?: MtmChoice[];
  defaultValue?: string;
};

export type ChildOptionRegistry = Record<string, ChildOption[]>;

export type DependencyRule = {
  id: string;
  description: string;
  if: Record<string, string[]>;
  thenShow?: string[];
  thenHide?: string[];
  thenHideFromCustomer?: string[];
  thenRecommend?: string[];
  thenAllow?: Record<string, string[]>;
};

export type SuitRedLabelOptionSet = {
  meta: {
    id: string;
    handle: string;
    title: string;
    category: 'suit';
    version: string;
    production: 'sartoria_red_label';
    namespace: 'gjm';
    includes: ['jacket', 'trouser'];
  };
  topLevelGroupedOptions: TopLevelGroupedOption[];
  childOptionRegistry: ChildOptionRegistry;
  initialDependencyRules: DependencyRule[];
  notes: string[];
};

export const suitRedLabelOptionSet: SuitRedLabelOptionSet =
  SUIT_RED_LABEL_V1_SEED as SuitRedLabelOptionSet;

export function getTopLevelRedLabelOptions(): TopLevelGroupedOption[] {
  return [...suitRedLabelOptionSet.topLevelGroupedOptions].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
}

export function getTopLevelRedLabelOption(
  key: string,
): TopLevelGroupedOption | undefined {
  return suitRedLabelOptionSet.topLevelGroupedOptions.find((option) => option.key === key);
}

export function getRedLabelChildOptions(groupKey: string): ChildOption[] {
  return suitRedLabelOptionSet.childOptionRegistry[groupKey] || [];
}

export function getAllRedLabelChildOptions(): ChildOption[] {
  return Object.values(suitRedLabelOptionSet.childOptionRegistry).flat();
}

export function getAllRedLabelOptionKeys(): string[] {
  const topLevel = suitRedLabelOptionSet.topLevelGroupedOptions.map((option) => option.key);
  const child = getAllRedLabelChildOptions().map((option) => option.key);
  return [...new Set([...topLevel, ...child])];
}

export function isRuleMatch(
  rule: DependencyRule,
  selections: SuitRedLabelSelections,
): boolean {
  return Object.entries(rule.if).every(([key, allowed]) => {
    const current = selections[key];
    if (typeof current !== 'string') return false;
    return allowed.includes(current);
  });
}

export function getVisibleChildOptionKeys(
  selections: SuitRedLabelSelections,
): Set<string> {
  const allChildKeys = new Set(getAllRedLabelChildOptions().map((option) => option.key));
  const explicitlyHidden = new Set<string>();
  const hiddenFromCustomer = new Set<string>();

  for (const rule of suitRedLabelOptionSet.initialDependencyRules) {
    if (!isRuleMatch(rule, selections) && Object.keys(rule.if).length > 0) continue;

    rule.thenHide?.forEach((key) => explicitlyHidden.add(key));
    rule.thenHideFromCustomer?.forEach((key) => hiddenFromCustomer.add(key));
  }

  for (const key of explicitlyHidden) {
    allChildKeys.delete(key);
  }

  for (const key of hiddenFromCustomer) {
    allChildKeys.delete(key);
  }

  return allChildKeys;
}

export function getVisibleRedLabelChildOptionsByGroup(
  groupKey: string,
  selections: SuitRedLabelSelections,
): ChildOption[] {
  const visibleKeys = getVisibleChildOptionKeys(selections);
  return getRedLabelChildOptions(groupKey).filter((option) => visibleKeys.has(option.key));
}

export function getRecommendedOptionKeys(
  selections: SuitRedLabelSelections,
): string[] {
  const recommended = new Set<string>();

  for (const rule of suitRedLabelOptionSet.initialDependencyRules) {
    if (!isRuleMatch(rule, selections)) continue;
    rule.thenRecommend?.forEach((key) => recommended.add(key));
  }

  return [...recommended];
}

export function getAllowedValuesForOption(
  optionKey: string,
  selections: SuitRedLabelSelections,
): string[] | null {
  const allowedSets: string[][] = [];

  for (const rule of suitRedLabelOptionSet.initialDependencyRules) {
    if (!rule.thenAllow) continue;
    if (!isRuleMatch(rule, selections)) continue;

    const allowed = rule.thenAllow[optionKey];
    if (allowed) allowedSets.push(allowed);
  }

  if (allowedSets.length === 0) return null;
  return allowedSets.flat();
}

export function calculateSelectionPriceDelta(
  selections: SuitRedLabelSelections,
): {
  total: number;
  breakdown: Array<{ key: string; label: string; amount: number }>;
} {
  const breakdown: Array<{ key: string; label: string; amount: number }> = [];

  const allOptions = [
    ...suitRedLabelOptionSet.topLevelGroupedOptions,
    ...getAllRedLabelChildOptions(),
  ];

  for (const option of allOptions) {
    if (!('choices' in option) || !option.choices?.length) continue;

    const selected = selections[option.key];
    if (typeof selected !== 'string') continue;

    const choice = option.choices.find((candidate) => candidate.value === selected);
    if (!choice?.priceDelta) continue;

    breakdown.push({
      key: option.key,
      label: `${option.label}: ${choice.label}`,
      amount: choice.priceDelta,
    });
  }

  return {
    total: breakdown.reduce((sum, item) => sum + item.amount, 0),
    breakdown,
  };
}

export function buildRedLabelSummary(
  selections: SuitRedLabelSelections,
): Record<string, string> {
  const summary: Record<string, string> = {};

  for (const option of suitRedLabelOptionSet.topLevelGroupedOptions) {
    const selected = selections[option.key];
    if (typeof selected !== 'string') continue;

    const label =
      option.choices?.find((choice) => choice.value === selected)?.label ?? selected;

    summary[option.key] = label;
  }

  return summary;
}

export const suitRedLabelSeed = suitRedLabelOptionSet;
export type RedLabelUiHint = MtmUiHint;
export type RedLabelOptionType = MtmOptionType;
export type RedLabelSection = MtmSection;
export type RedLabelChoice = MtmChoice;
export type RedLabelOption = ChildOption;
export type RedLabelChildRegistry = ChildOptionRegistry;
export type RedLabelRule = DependencyRule;
export type RedLabelSeedPackage = SuitRedLabelOptionSet;
export const getSuitRedLabelTopLevelOptions = getTopLevelRedLabelOptions;
export const getSuitRedLabelChildOptions = getRedLabelChildOptions;
export const getSuitRedLabelRuleSet = () => suitRedLabelOptionSet.initialDependencyRules;