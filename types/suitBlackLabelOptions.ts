import { SUIT_BLACK_LABEL_V1_OPTION_C } from '../scripts/data/suit-black-label-v1-option-c.mjs';

export type MtmOptionType =
  | 'radio'
  | 'select'
  | 'toggle'
  | 'text'
  | 'number'
  | 'multiselect';

export type MtmChoice = {
  value: string;
  label: string;
  priceDelta?: number;
  image?: string;
};

export type DependsOnRule = Record<string, string | string[]>;

export type MtmOption = {
  key: string;
  label: string;
  type: MtmOptionType;
  uiHint: 'cards' | 'buttons' | 'dropdown' | 'text' | 'number';
  required: boolean;
  sortOrder: number;
  helpText?: string;
  section:
    | 'design'
    | 'jacket_design'
    | 'jacket_construction'
    | 'jacket_pockets'
    | 'jacket_details'
    | 'jacket_interior'
    | 'jacket_personalisation'
    | 'trouser_design'
    | 'trouser_construction'
    | 'trouser_pockets'
    | 'trouser_details'
    | 'trouser_finish';
  dependsOn?: DependsOnRule;
  choices?: MtmChoice[];
};

export type SuitBlackLabelRule = {
  if: Partial<Record<string, string>>;
  then: {
    set?: Record<string, string>;
    disallow?: Record<string, string[]>;
    force?: Record<string, string>;
    hide?: string[];
    requireExternalStitchingCodeFamily?: string[];
  };
};

export type MtmOptionSet = {
  id: string;
  handle: string;
  title: string;
  category: 'suit';
  version: string;
  production: 'sartoria_black_label';
  includes: string[];
  options: MtmOption[];
  rules: SuitBlackLabelRule[];
  notes: string[];
};

export const suitBlackLabelOptionSet: MtmOptionSet = {
  id: SUIT_BLACK_LABEL_V1_OPTION_C.id,
  handle: SUIT_BLACK_LABEL_V1_OPTION_C.handle,
  title: SUIT_BLACK_LABEL_V1_OPTION_C.title,
  category: SUIT_BLACK_LABEL_V1_OPTION_C.category,
  version: SUIT_BLACK_LABEL_V1_OPTION_C.version,
  production: SUIT_BLACK_LABEL_V1_OPTION_C.production,
  includes: SUIT_BLACK_LABEL_V1_OPTION_C.includes,
  options: SUIT_BLACK_LABEL_V1_OPTION_C.options as MtmOption[],
  rules: SUIT_BLACK_LABEL_V1_OPTION_C.rules as SuitBlackLabelRule[],
  notes: SUIT_BLACK_LABEL_V1_OPTION_C.notes,
};

export function isOptionVisible(
  option: MtmOption,
  selections: Record<string, string | string[] | undefined>
): boolean {
  if (!option.dependsOn) return true;

  return Object.entries(option.dependsOn).every(([depKey, depValue]) => {
    const selected = selections[depKey];

    if (Array.isArray(depValue)) {
      if (Array.isArray(selected)) return selected.some((v) => depValue.includes(v));
      return typeof selected === 'string' ? depValue.includes(selected) : false;
    }

    if (Array.isArray(selected)) return selected.includes(depValue);
    return selected === depValue;
  });
}

export function getVisibleSuitBlackLabelOptions(
  selections: Record<string, string | string[] | undefined>
): MtmOption[] {
  return [...suitBlackLabelOptionSet.options]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((option) => isOptionVisible(option, selections));
}

export function applySuitBlackLabelRules(
  selections: Record<string, string | string[] | undefined>
) {
  const next: Record<string, string | string[] | undefined> = { ...selections };

  for (const rule of suitBlackLabelOptionSet.rules) {
    const matches = Object.entries(rule.if).every(([key, value]) => next[key] === value);
    if (!matches) continue;

    if (rule.then.set) {
      Object.entries(rule.then.set).forEach(([key, value]) => {
        next[key] = value;
      });
    }

    if (rule.then.force) {
      Object.entries(rule.then.force).forEach(([key, value]) => {
        next[key] = value;
      });
    }

    if (rule.then.disallow) {
      Object.entries(rule.then.disallow).forEach(([key, disallowed]) => {
        const current = next[key];
        if (typeof current === 'string' && disallowed.includes(current)) {
          delete next[key];
        }
      });
    }
  }

  return next;
}
