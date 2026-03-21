'use client';

import { useMemo } from 'react';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { type MtmOption } from '@/types/trouserOptions';
import { type TrouserSelections } from '@/components/TrouserDesignConfigurator';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TrouserDesignSummaryProps {
  /** Current selections — same value passed to TrouserDesignConfigurator */
  value: TrouserSelections;
  /** Visible options — pass getVisibleTrouserOptions(value) from the parent */
  visibleOptions: MtmOption[];
  /** Base garment price */
  basePrice?: number;
  /** Cumulative upcharge from onChange delta */
  priceDelta?: number;
  /** Currency symbol (default: £) */
  currencySymbol?: string;
  /** Fired when the user saves the design configuration */
  onSave?: (selections: TrouserSelections) => void;
  /** Fired when the user proceeds to the fit step */
  onContinueToFit?: (selections: TrouserSelections) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtPrice(amount: number, symbol: string): string {
  return `${symbol}${amount.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// TrouserDesignSummary
// ---------------------------------------------------------------------------

export default function TrouserDesignSummary({
  value,
  visibleOptions,
  basePrice = 0,
  priceDelta = 0,
  currencySymbol = '£',
  onSave,
  onContinueToFit,
}: TrouserDesignSummaryProps) {
  // Split options into selected and missing-required
  const { selected, missing } = useMemo(() => {
    const selected: Array<{ option: MtmOption; choiceLabel: string; upcharge: number }> = [];
    const missing: MtmOption[] = [];

    for (const option of visibleOptions) {
      const val = value[option.key];
      const choice = option.choices?.find((c) => c.value === val);
      if (choice) {
        selected.push({
          option,
          choiceLabel: choice.label,
          upcharge: choice.priceDelta ?? 0,
        });
      } else if (option.required) {
        missing.push(option);
      }
    }

    return { selected, missing };
  }, [visibleOptions, value]);

  const isComplete = missing.length === 0;
  const totalPrice = basePrice + priceDelta;

  return (
    <div className="flex flex-col gap-4">
      {/* Validation banner */}
      {!isComplete && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="text-xs font-semibold text-amber-700">
              {missing.length} selection{missing.length > 1 ? 's' : ''} remaining
            </p>
            <p className="mt-0.5 text-xs text-amber-600">
              {missing.map((o) => o.label).join(', ')}
            </p>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle size={16} className="shrink-0 text-green-600" />
          <p className="text-xs font-semibold text-green-700">All options selected</p>
        </div>
      )}

      {/* Selected options list */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Design Selections
          </p>
        </div>

        <ul className="divide-y divide-gray-100">
          {visibleOptions.map((option) => {
            const val = value[option.key];
            const choice = option.choices?.find((c) => c.value === val);
            const filled = !!choice;

            return (
              <li
                key={option.key}
                className="flex items-center justify-between px-4 py-2.5 gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {filled ? (
                    <CheckCircle size={14} className="shrink-0 text-[#826300]" />
                  ) : (
                    <Circle size={14} className="shrink-0 text-gray-300" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 leading-none">{option.label}</p>
                    {filled && (
                      <p className="text-sm font-medium text-gray-900 leading-tight mt-0.5 truncate">
                        {choice!.label}
                      </p>
                    )}
                    {!filled && option.required && (
                      <p className="text-xs text-amber-500 leading-tight mt-0.5">Required</p>
                    )}
                  </div>
                </div>

                {filled && (choice!.priceDelta ?? 0) > 0 && (
                  <span className="shrink-0 text-xs font-semibold text-[#826300]">
                    +{fmtPrice(choice!.priceDelta!, currencySymbol)}
                  </span>
                )}
                {filled && (choice!.priceDelta ?? 0) === 0 && (
                  <span className="shrink-0 text-xs text-gray-400">Included</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Price breakdown */}
      {basePrice > 0 && (
        <div className="rounded-xl border border-gray-200 bg-[#F1EFEC] px-4 py-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Base price</span>
            <span>{fmtPrice(basePrice, currencySymbol)}</span>
          </div>

          {selected
            .filter((s) => s.upcharge > 0)
            .map((s) => (
              <div
                key={s.option.key}
                className="flex justify-between text-sm text-gray-500"
              >
                <span className="truncate mr-4">{s.option.label}</span>
                <span className="shrink-0">+{fmtPrice(s.upcharge, currencySymbol)}</span>
              </div>
            ))}

          <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-300">
            <span>Design total</span>
            <span>{fmtPrice(totalPrice, currencySymbol)}</span>
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!isComplete}
          onClick={() => onContinueToFit?.(value)}
          className={[
            'w-full py-3 px-6 rounded-xl text-sm font-semibold tracking-wide',
            'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#826300]',
            isComplete
              ? 'bg-[#826300] text-white hover:bg-[#6a5100] active:scale-[0.99]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          ].join(' ')}
        >
          Continue to Fit
        </button>

        {onSave && (
          <button
            type="button"
            onClick={() => onSave(value)}
            className="w-full py-3 px-6 rounded-xl text-sm font-semibold tracking-wide border border-gray-300 text-gray-700 hover:border-gray-500 hover:text-gray-900 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#826300]"
          >
            Save Design
          </button>
        )}
      </div>
    </div>
  );
}
