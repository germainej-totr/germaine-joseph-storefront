'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import SuitBlackLabelConfigurator, {
  type SuitBlackLabelSelections,
} from '@/src/components/mtm/SuitBlackLabelConfigurator';
import {
  suitBlackLabelOptionSet,
  applySuitBlackLabelRules,
  getVisibleSuitBlackLabelOptions,
} from '@/src/lib/mtm/suitBlackLabelOptions';

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
  selections: SuitBlackLabelSelections;
  pricing: {
    total: number;
    breakdown: PriceBreakdownItem[];
  };
  validation: {
    isValid: boolean;
    missingRequired: string[];
    errors: string[];
  };
};

type Props = {
  initialSelections?: SuitBlackLabelSelections;
  currencySymbol?: string;
  onSaveDraft?: (payload: CanonicalPayload) => Promise<void> | void;
  onContinue?: (payload: CanonicalPayload) => Promise<void> | void;
};

const STORAGE_KEY = 'gjm_suit_black_label_draft';
const AMF_COMPATIBLE_PREFIXES = ['0a', '0b', '1', '2', '3', '5'];

function supportsNaturalShoulders(externalStitchingStyle?: string | string[]) {
  if (typeof externalStitchingStyle !== 'string') return false;

  return AMF_COMPATIBLE_PREFIXES.some((prefix) =>
    externalStitchingStyle.toLowerCase().includes(`${prefix}_`),
  );
}

export default function SuitBlackLabelController({
  initialSelections = { production: 'sartoria_black_label' },
  currencySymbol = '$',
  onSaveDraft,
  onContinue,
}: Props) {
  const [selections, setSelections] = useState<SuitBlackLabelSelections>(initialSelections);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const saved =
      typeof window !== 'undefined'
        ? window.sessionStorage.getItem(STORAGE_KEY)
        : null;

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SuitBlackLabelSelections;
        setSelections(applySuitBlackLabelRules(parsed));
      } catch {
        setSelections(applySuitBlackLabelRules(initialSelections));
      }
    } else {
      setSelections(applySuitBlackLabelRules(initialSelections));
    }
  }, [initialSelections]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
    }
  }, [selections]);

  const normalizedSelections = useMemo(
    () => applySuitBlackLabelRules(selections),
    [selections],
  );

  const visibleOptions = useMemo(
    () => getVisibleSuitBlackLabelOptions(normalizedSelections),
    [normalizedSelections],
  );

  const validation = useMemo(() => {
    const missingRequired: string[] = [];
    const errors: string[] = [];

    for (const option of visibleOptions) {
      const value = normalizedSelections[option.key];

      if (!option.required) continue;

      const isEmpty =
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) missingRequired.push(option.label);
    }

    if (
      normalizedSelections.construction === 'air_model' &&
      normalizedSelections.interior_lining !== 'none'
    ) {
      errors.push('Air Model must use Interior Lining: None.');
    }

    if (normalizedSelections.trouser_fit === 'modern_pants') {
      if (normalizedSelections.trouser_front_pockets === 'watch_pocket') {
        errors.push('Modern Pants cannot use Watch Pocket.');
      }
      if (normalizedSelections.trouser_waistband === 'belt_loops') {
        errors.push('Modern Pants cannot use Belt Loops.');
      }
      if (
        normalizedSelections.trouser_fastening !== 'square_extended_tab_button_closure'
      ) {
        errors.push('Modern Pants must use the square extended tab button closure.');
      }
    }

    if (
      normalizedSelections.shoulders === 'natural' &&
      !supportsNaturalShoulders(normalizedSelections.external_stitching_style)
    ) {
      errors.push('Natural shoulders require a compatible AMF stitching selection.');
    }

    return {
      isValid: missingRequired.length === 0 && errors.length === 0,
      missingRequired,
      errors,
    };
  }, [visibleOptions, normalizedSelections]);

  const pricing = useMemo(() => {
    const breakdown: PriceBreakdownItem[] = [];

    for (const option of visibleOptions) {
      const value = normalizedSelections[option.key];
      if (!option.choices) continue;

      if (Array.isArray(value)) {
        for (const selected of value) {
          const choice = option.choices.find((candidate) => candidate.value === selected);
          if (choice?.priceDelta) {
            breakdown.push({
              key: option.key,
              label: `${option.label}: ${choice.label}`,
              amount: choice.priceDelta,
            });
          }
        }
      } else if (typeof value === 'string') {
        const choice = option.choices.find((candidate) => candidate.value === value);
        if (choice?.priceDelta) {
          breakdown.push({
            key: option.key,
            label: `${option.label}: ${choice.label}`,
            amount: choice.priceDelta,
          });
        }
      }
    }

    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

    return { total, breakdown };
  }, [visibleOptions, normalizedSelections]);

  const canonicalPayload = useMemo<CanonicalPayload>(
    () => ({
      category: 'suit',
      optionSet: suitBlackLabelOptionSet.handle,
      optionSetVersion: suitBlackLabelOptionSet.version,
      production: suitBlackLabelOptionSet.production,
      selections: normalizedSelections,
      pricing,
      validation,
    }),
    [normalizedSelections, pricing, validation],
  );

  async function handleSaveDraft() {
    setStatus('');

    if (onSaveDraft) {
      await onSaveDraft(canonicalPayload);
      setStatus('Draft saved.');
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSelections));
    }

    setStatus('Draft saved to session.');
  }

  async function handleContinue() {
    setStatus('');

    if (!validation.isValid) {
      setStatus('Please complete the required fields before continuing.');
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
        <SuitBlackLabelConfigurator
          value={normalizedSelections}
          onChange={setSelections}
          currencySymbol={currencySymbol}
          title="Sartoria Black Label Suit"
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

          <div style={styles.sectionRule}>
            <strong>Rule Notes</strong>
            <ul style={styles.list}>
              <li>Air Model forces Interior Lining to None.</li>
              <li>
                Modern Pants disables Watch Pocket and Belt Loops, and forces the
                extended fastening path.
              </li>
              <li>
                Natural shoulders require compatible external stitching around the
                armhole.
              </li>
            </ul>
          </div>

          <div style={styles.sectionRule}>
            <strong>Validation</strong>
            {validation.isValid ? (
              <div style={styles.valid}>All required visible fields complete.</div>
            ) : (
              <div style={styles.invalid}>
                {validation.missingRequired.length > 0 ? (
                  <div>
                    <strong>Missing:</strong> {validation.missingRequired.join(', ')}
                  </div>
                ) : null}
                {validation.errors.map((error) => (
                  <div key={error}>{error}</div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.sectionRule}>
            <strong>Pricing Breakdown</strong>
            {pricing.breakdown.length === 0 ? (
              <div style={styles.muted}>No design upcharges selected.</div>
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
  sectionRule: {
    display: 'grid',
    gap: 8,
    fontSize: 14,
  },
  list: {
    margin: 0,
    paddingLeft: 18,
    color: '#555',
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