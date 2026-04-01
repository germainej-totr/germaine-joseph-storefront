'use client';

import { useMemo, useCallback } from 'react';
import type { MtmOption, MtmChoice, MtmOptionSet } from '@/types/trouserOptions';

// ---------------------------------------------------------------------------
// Public API types
// ---------------------------------------------------------------------------

export type GenericMtmSelections = Record<string, string | undefined>;

export interface GenericMtmConfiguratorProps {
  /** Controlled selections — parent owns state */
  value: GenericMtmSelections;
  /** Fires on every selection change with updated selections + cumulative delta */
  onChange: (next: GenericMtmSelections, priceDelta: number) => void;
  /** The option-set schema (required for generic usage) */
  optionSet: MtmOptionSet;
  /** Base price used in price summary and onComplete total */
  basePrice?: number;
  /** Fires on submit — CTA only rendered when this is provided */
  onComplete?: (selections: GenericMtmSelections, totalPrice: number) => void;
  /** Currency symbol prefix (default: £) */
  currencySymbol?: string;
  /** Optional page/section heading */
  title?: string;
  /** Submit button label */
  ctaLabel?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECTION_ORDER = [
  'design',
  'details',
  'construction',
  'pockets',
  'finish',
  'formal_details',
] as const;

const SECTION_LABELS: Record<string, string> = {
  design: 'Design',
  details: 'Details',
  construction: 'Construction',
  pockets: 'Pockets',
  finish: 'Finish',
  formal_details: 'Formal Details',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getVisibleOptions(
  selections: GenericMtmSelections,
  optionSet: MtmOptionSet,
): MtmOption[] {
  const visible: MtmOption[] = [];

  for (const option of optionSet.options) {
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

function isOptionVisible(
  option: MtmOption,
  selections: GenericMtmSelections,
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

function computePriceDelta(
  visibleOptions: MtmOption[],
  selections: GenericMtmSelections,
): number {
  return visibleOptions.reduce((total, option) => {
    const chosen = option.choices?.find((c) => c.value === selections[option.key]);
    return total + (chosen?.priceDelta ?? 0);
  }, 0);
}

function fmtPrice(amount: number, symbol: string): string {
  return `${symbol}${amount.toFixed(2)}`;
}

function uiHintLabel(option: MtmOption): string {
  if (option.uiHint === 'cards') return 'Choose one';
  if (option.uiHint === 'buttons') return 'Select an option';
  if (option.uiHint === 'dropdown') return 'Select from list';
  return option.type;
}

// ---------------------------------------------------------------------------
// Atomic price display components
// ---------------------------------------------------------------------------

function PriceDelta({ amount, symbol }: { amount: number; symbol: string }) {
  if (!amount) return <div className="mt-2 text-xs text-gray-400">Included</div>;
  return (
    <div className="mt-2 text-xs font-semibold text-[#826300]">
      +{fmtPrice(amount, symbol)}
    </div>
  );
}

function InlinePriceDelta({ amount, symbol }: { amount: number; symbol: string }) {
  if (!amount) return <span className="opacity-60">Included</span>;
  return <span>+{fmtPrice(amount, symbol)}</span>;
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3 mt-8 first:mt-0 select-none">
      {label}
    </h3>
  );
}

// ---------------------------------------------------------------------------
// ChoiceCards — uiHint: "cards"
// ---------------------------------------------------------------------------

function ChoiceCards({
  choices,
  selected,
  onChange,
  symbol,
}: {
  choices: MtmChoice[];
  selected?: string;
  onChange: (value: string) => void;
  symbol: string;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {choices.map((choice) => {
        const active = selected === choice.value;
        return (
          <button
            key={choice.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(choice.value)}
            className={[
              'relative flex flex-col items-start gap-1 p-3 rounded-xl border text-left min-h-[80px] justify-between',
              'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#826300]',
              active
                ? 'border-[#826300] bg-amber-50 ring-1 ring-[#826300]'
                : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50',
            ].join(' ')}
          >
            <span className="text-sm font-semibold text-gray-900 leading-snug">
              {choice.label}
            </span>
            <PriceDelta amount={choice.priceDelta ?? 0} symbol={symbol} />
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChoiceButtons — uiHint: "buttons"
// ---------------------------------------------------------------------------

function ChoiceButtons({
  choices,
  selected,
  onChange,
  symbol,
}: {
  choices: MtmChoice[];
  selected?: string;
  onChange: (value: string) => void;
  symbol: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {choices.map((choice) => {
        const active = selected === choice.value;
        return (
          <button
            key={choice.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(choice.value)}
            className={[
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm',
              'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#826300]',
              active
                ? 'border-[#826300] bg-[#826300] text-white'
                : 'border-gray-300 text-gray-700 hover:border-gray-500 hover:text-gray-900',
            ].join(' ')}
          >
            <span>{choice.label}</span>
            <span className={`text-xs ${active ? 'text-amber-200' : 'text-gray-400'}`}>
              <InlinePriceDelta amount={choice.priceDelta ?? 0} symbol={symbol} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChoiceSelect — uiHint: "dropdown"
// ---------------------------------------------------------------------------

function ChoiceSelect({
  label,
  choices,
  selected,
  onChange,
  symbol,
}: {
  label: string;
  choices: MtmChoice[];
  selected?: string;
  onChange: (value: string) => void;
  symbol: string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={selected ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm text-gray-800 bg-white
          focus:outline-none focus:ring-2 focus:ring-[#826300] focus:border-[#826300] transition-colors"
      >
        <option value="" disabled>
          Select {label.toLowerCase()}…
        </option>
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
            {(choice.priceDelta ?? 0) > 0
              ? ` (+${fmtPrice(choice.priceDelta!, symbol)})`
              : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

// ---------------------------------------------------------------------------
// OptionRenderer — dispatches to the correct widget
// ---------------------------------------------------------------------------

function OptionRenderer({
  option,
  selected,
  onChange,
  symbol,
}: {
  option: MtmOption;
  selected: string | undefined;
  onChange: (value: string) => void;
  symbol: string;
}) {
  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-white">
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-800 leading-none">
          {option.label}
          {option.required && (
            <span className="ml-1 text-red-600 font-normal text-xs">*</span>
          )}
        </p>
        <p className="mt-1 text-xs text-gray-500">{uiHintLabel(option)}</p>
      </div>

      {option.uiHint === 'cards' && (
        <ChoiceCards
          choices={option.choices ?? []}
          selected={selected}
          onChange={onChange}
          symbol={symbol}
        />
      )}
      {option.uiHint === 'buttons' && (
        <ChoiceButtons
          choices={option.choices ?? []}
          selected={selected}
          onChange={onChange}
          symbol={symbol}
        />
      )}
      {option.uiHint === 'dropdown' && (
        <ChoiceSelect
          label={option.label}
          choices={option.choices ?? []}
          selected={selected}
          onChange={onChange}
          symbol={symbol}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PriceSummaryPanel
// ---------------------------------------------------------------------------

function PriceSummaryPanel({
  basePrice,
  delta,
  selections,
  visibleOptions,
  symbol,
}: {
  basePrice: number;
  delta: number;
  selections: GenericMtmSelections;
  visibleOptions: MtmOption[];
  symbol: string;
}) {
  const breakdown = visibleOptions.flatMap((opt) => {
    const choice = opt.choices?.find((c) => c.value === selections[opt.key]);
    if (!choice || (choice.priceDelta ?? 0) === 0) return [];
    return [{ label: `${opt.label}: ${choice.label}`, delta: choice.priceDelta! }];
  });

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-[#F1EFEC] px-4 py-4 space-y-2">
      <div className="flex justify-between text-sm text-gray-500">
        <span>Base price</span>
        <span>{fmtPrice(basePrice, symbol)}</span>
      </div>
      {breakdown.map((item) => (
        <div key={item.label} className="flex justify-between text-sm text-gray-500">
          <span className="truncate mr-4">{item.label}</span>
          <span className="shrink-0">+{fmtPrice(item.delta, symbol)}</span>
        </div>
      ))}
      <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-300">
        <span>Total</span>
        <span>{fmtPrice(basePrice + delta, symbol)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GenericMtmConfigurator — main export
// ---------------------------------------------------------------------------

export default function GenericMtmConfigurator({
  value,
  onChange,
  optionSet,
  basePrice = 0,
  onComplete,
  currencySymbol = '£',
  title,
  ctaLabel = 'Add to Cart',
}: GenericMtmConfiguratorProps) {
  const visibleOptions = useMemo(
    () => getVisibleOptions(value, optionSet),
    [value, optionSet],
  );

  const priceDelta = useMemo(
    () => computePriceDelta(visibleOptions, value),
    [visibleOptions, value],
  );

  const allRequiredFilled = useMemo(
    () => visibleOptions.filter((o) => o.required).every((o) => !!value[o.key]),
    [visibleOptions, value],
  );

  // Group by section in canonical SECTION_ORDER
  const orderedSections = useMemo(() => {
    const map = new Map<string, MtmOption[]>();
    for (const option of visibleOptions) {
      const group = map.get(option.section) ?? [];
      group.push(option);
      map.set(option.section, group);
    }
    return SECTION_ORDER.flatMap((key) => {
      const opts = map.get(key);
      return opts ? [[key, opts] as [string, MtmOption[]]] : [];
    });
  }, [visibleOptions]);

  const handleSelect = useCallback(
    (optionKey: string, nextValue: string) => {
      const next: GenericMtmSelections = { ...value, [optionKey]: nextValue };

      // Cascade: clear stale values for options now hidden by this change
      for (const opt of optionSet.options) {
        if (opt.key === optionKey || !opt.dependsOn) continue;
        if (!isOptionVisible(opt, next)) {
          delete next[opt.key];
        }
      }

      const newVisible = getVisibleOptions(next, optionSet);
      const newDelta = computePriceDelta(newVisible, next);
      onChange(next, newDelta);
    },
    [value, optionSet, onChange],
  );

  return (
    <div className="w-full max-w-2xl">
      {/* Optional header: title + live upcharge badge */}
      {(title || basePrice > 0) && (
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          {title && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h2>
              <p className="mt-1 text-sm text-gray-500">
                Configure the design details for your {optionSet.category}.
              </p>
            </div>
          )}
          {basePrice > 0 && (
            <div className="border border-gray-200 rounded-2xl px-4 py-3 bg-[#F1EFEC] min-w-[160px]">
              <p className="text-xs text-gray-500 mb-1">Design upcharge</p>
              <p className="text-xl font-bold text-gray-900">
                {priceDelta > 0
                  ? `+${fmtPrice(priceDelta, currencySymbol)}`
                  : fmtPrice(0, currencySymbol)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Section groups */}
      {orderedSections.map(([section, opts]) => (
        <div key={section}>
          <SectionHeader label={SECTION_LABELS[section] ?? section} />
          <div className="space-y-3">
            {opts.map((option) => (
              <OptionRenderer
                key={option.key}
                option={option}
                selected={value[option.key]}
                onChange={(v) => handleSelect(option.key, v)}
                symbol={currencySymbol}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Full price breakdown — only when basePrice is provided */}
      {basePrice > 0 && (
        <PriceSummaryPanel
          basePrice={basePrice}
          delta={priceDelta}
          selections={value}
          visibleOptions={visibleOptions}
          symbol={currencySymbol}
        />
      )}

      {/* Submit CTA — only rendered when onComplete handler is wired up */}
      {onComplete && (
        <button
          type="button"
          disabled={!allRequiredFilled}
          onClick={() => onComplete(value, basePrice + priceDelta)}
          className={[
            'mt-6 w-full py-3 px-6 rounded-xl text-sm font-semibold tracking-wide',
            'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#826300]',
            allRequiredFilled
              ? 'bg-[#826300] text-white hover:bg-[#6a5100] active:scale-[0.99]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          ].join(' ')}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
