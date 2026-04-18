'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import SuitRedLabelConfigurator from '@/src/components/mtm/SuitRedLabelConfigurator';
import {
  suitRedLabelOptionSet,
  calculateSelectionPriceDelta,
  buildRedLabelSummary,
  getTopLevelRedLabelOptions,
  getVisibleRedLabelChildOptionsByGroup,
  type SuitRedLabelSelections,
  type ChildOption,
} from '@/src/lib/mtm/suitRedLabelOptions';

type PriceBreakdownItem = {
  key: string;
  label: string;
  amount: number;
};

export type CanonicalPayload = {
  category: 'suit';
  optionSet: string;
  optionSetVersion: string;
  production: string;
  selections: SuitRedLabelSelections;
  pricing: {
    total: number;
    breakdown: PriceBreakdownItem[];
  };
  summary: Record<string, string>;
  validation: {
    isValid: boolean;
    missingRequired: string[];
    errors: string[];
  };
};

type Props = {
  initialSelections?: SuitRedLabelSelections;
  currencySymbol?: string;
  onSaveDraft?: (payload: CanonicalPayload) => Promise<void> | void;
  onContinue?: (payload: CanonicalPayload) => Promise<void> | void;
};

const STORAGE_KEY = 'gjm_suit_red_label_draft';

export default function SuitRedLabelController({
  initialSelections = { production: 'sartoria_red_label' },
  currencySymbol = '$',
  onSaveDraft,
  onContinue,
}: Props) {
  const [selections, setSelections] = useState<SuitRedLabelSelections>(initialSelections);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    const saved =
      typeof window !== 'undefined'
        ? window.sessionStorage.getItem(STORAGE_KEY)
        : null;

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SuitRedLabelSelections;
        setSelections({ ...initialSelections, ...parsed });
      } catch {
        setSelections(initialSelections);
      }
    } else {
      setSelections(initialSelections);
    }
  }, [initialSelections]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
    }
  }, [selections]);

  const allRenderableOptions = useMemo(() => {
    const topLevel = getTopLevelRedLabelOptions();

    const children: ChildOption[] = [];
    for (const top of topLevel) {
      if (top.type !== 'group') continue;
      const visible = getVisibleRedLabelChildOptionsByGroup(top.key, selections);
      children.push(...visible);
    }

    return { topLevel, children };
  }, [selections]);

  const validation = useMemo(() => {
    const missingRequired: string[] = [];
    const errors: string[] = [];

    for (const option of allRenderableOptions.topLevel) {
      const value = selections[option.key];

      if (option.required) {
        const isEmpty =
          value === undefined ||
          value === '' ||
          (Array.isArray(value) && value.length === 0);

        if (isEmpty) missingRequired.push(option.label);
      }
    }

    for (const child of allRenderableOptions.children) {
      const value = selections[child.key];

      if (child.required) {
        const isEmpty =
          value === undefined ||
          value === '' ||
          (Array.isArray(value) && value.length === 0);

        if (isEmpty) missingRequired.push(child.label);
      }
    }

    if (
      selections.interior_lining_type === 'no_lining' &&
      selections.interior_lining_selection
    ) {
      errors.push('Interior lining selection should not be set when no lining is selected.');
    }

    if (
      selections.inside_pocket_lining === 'choose_lining' &&
      !selections.interior_lining_selection
    ) {
      errors.push('Inside pocket lining requires a selected interior lining.');
    }

    if (
      selections.fit !== 'slim_drop_8' &&
      selections.collar_finishing === 'handmade'
    ) {
      errors.push('Handmade collar finishing is only available for slim models.');
    }

    return {
      isValid: missingRequired.length === 0 && errors.length === 0,
      missingRequired,
      errors,
    };
  }, [allRenderableOptions, selections]);

  const pricing = useMemo(() => calculateSelectionPriceDelta(selections), [selections]);

  const summary = useMemo(() => buildRedLabelSummary(selections), [selections]);

  const canonicalPayload = useMemo<CanonicalPayload>(
    () => ({
      category: 'suit',
      optionSet: suitRedLabelOptionSet.meta.handle,
      optionSetVersion: suitRedLabelOptionSet.meta.version,
      production: suitRedLabelOptionSet.meta.production,
      selections,
      pricing,
      summary,
      validation,
    }),
    [selections, pricing, summary, validation],
  );

  async function handleSaveDraft() {
    setStatus('');

    if (onSaveDraft) {
      await onSaveDraft(canonicalPayload);
      setStatus('Draft saved.');
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
    }

    setStatus('Draft saved.');
  }

  async function handleContinue() {
    setStatus('');

    if (!validation.isValid) {
      setStatus('Please complete all required fields before continuing.');
      return;
    }

    if (onContinue) {
      await onContinue(canonicalPayload);
      return;
    }

    setStatus('Configuration complete. Ready for next step.');
  }

  return (
    <div style={styles.layout}>
      <div style={styles.main}>
        <SuitRedLabelConfigurator
          value={selections}
          onChange={setSelections}
          currencySymbol={currencySymbol}
          title="Sartoria Red Label Suit"
        />
      </div>

      <aside style={styles.sidebar}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryTitle}>Configuration Summary</div>

          <div style={styles.summaryMeta}>
            <div>
              <strong>Option Set:</strong> {canonicalPayload.optionSet}
            </div>
            <div>
              <strong>Production:</strong> {canonicalPayload.production}
            </div>
          </div>

          <div style={styles.sectionBlock}>
            <strong>Selected Top-Level Options</strong>
            {Object.keys(summary).length === 0 ? (
              <div style={styles.muted}>No selections yet.</div>
            ) : (
              <div style={styles.breakdown}>
                {Object.entries(summary).map(([key, value]) => (
                  <div key={key} style={styles.row}>
                    <span>{humanizeKey(key)}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.sectionBlock}>
            <strong>Validation</strong>
            {validation.isValid ? (
              <div style={styles.valid}>All required visible fields complete.</div>
            ) : (
              <div style={styles.invalid}>
                {validation.missingRequired.length > 0 ? (
                  <div>
                    <strong>Missing:</strong>{' '}
                    {validation.missingRequired.join(', ')}
                  </div>
                ) : null}
                {validation.errors.map((err) => (
                  <div key={err}>{err}</div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.sectionBlock}>
            <strong>Pricing Breakdown</strong>
            {pricing.breakdown.length === 0 ? (
              <div style={styles.muted}>No upcharges selected.</div>
            ) : (
              <div style={styles.breakdown}>
                {pricing.breakdown.map((item) => (
                  <div key={`${item.key}-${item.label}`} style={styles.row}>
                    <span>{item.label}</span>
                    <span>
                      {currencySymbol}
                      {item.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={styles.totalRow}>
              <strong>Total</strong>
              <strong>
                {currencySymbol}
                {pricing.total.toFixed(2)}
              </strong>
            </div>
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={handleSaveDraft} style={styles.secondaryBtn}>
              Save Draft
            </button>
            <button type="button" onClick={handleContinue} style={styles.primaryBtn}>
              Continue
            </button>
          </div>

          {status ? <div style={styles.status}>{status}</div> : null}
        </div>
      </aside>
    </div>
  );
}

function humanizeKey(key: string) {
  return key
    .replace(/^trouser_/, 'Trouser ')
    .replace(/^jacket_/, 'Jacket ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

const styles: Record<string, CSSProperties> = {
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 340px',
    gap: 24,
    alignItems: 'start',
  },
  main: {
    minWidth: 0,
  },
  sidebar: {
    position: 'sticky',
    top: 16,
  },
  summaryCard: {
    border: '1px solid #e8e8e8',
    borderRadius: 16,
    padding: 16,
    background: '#fff',
    display: 'grid',
    gap: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  summaryMeta: {
    display: 'grid',
    gap: 6,
    fontSize: 14,
    color: '#333',
  },
  sectionBlock: {
    display: 'grid',
    gap: 8,
    fontSize: 14,
  },
  valid: {
    color: '#166534',
    fontWeight: 600,
  },
  invalid: {
    color: '#991b1b',
    display: 'grid',
    gap: 6,
  },
  muted: {
    color: '#777',
  },
  breakdown: {
    display: 'grid',
    gap: 8,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 13,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
    borderTop: '1px solid #eee',
  },
  actions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    border: '1px solid #111',
    background: '#111',
    color: '#fff',
    borderRadius: 10,
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  secondaryBtn: {
    border: '1px solid #ddd',
    background: '#fff',
    color: '#111',
    borderRadius: 10,
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  status: {
    fontSize: 13,
    color: '#555',
  },
};