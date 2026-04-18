'use client';

import { useMemo, type CSSProperties } from 'react';
import {
  getTopLevelRedLabelOptions,
  getVisibleRedLabelChildOptionsByGroup,
  getRecommendedOptionKeys,
  calculateSelectionPriceDelta,
  type SuitRedLabelSelections,
  type TopLevelGroupedOption,
  type ChildOption,
  type MtmChoice,
  type MtmUiHint,
} from '@/src/lib/mtm/suitRedLabelOptions';

type Props = {
  value: SuitRedLabelSelections;
  onChange: (next: SuitRedLabelSelections) => void;
  currencySymbol?: string;
  title?: string;
};

const sectionLabels: Record<string, string> = {
  jacket_design: 'Jacket Design',
  jacket_interior: 'Jacket Interior',
  jacket_details: 'Jacket Details',
  jacket_personalisation: 'Jacket Personalisation',
  trouser_design: 'Trouser Design',
  trouser_details: 'Trouser Details',
};

export default function SuitRedLabelConfigurator({
  value,
  onChange,
  currencySymbol = '$',
  title = 'Sartoria Red Label Suit',
}: Props) {
  const topLevelOptions = useMemo(() => getTopLevelRedLabelOptions(), []);
  const groupedBySection = useMemo(() => {
    const grouped = new Map<string, TopLevelGroupedOption[]>();
    for (const option of topLevelOptions) {
      const bucket = grouped.get(option.section) || [];
      bucket.push(option);
      grouped.set(option.section, bucket);
    }
    return Array.from(grouped.entries());
  }, [topLevelOptions]);

  const pricing = useMemo(() => calculateSelectionPriceDelta(value), [value]);
  const recommendedKeys = useMemo(() => getRecommendedOptionKeys(value), [value]);

  function updateValue(key: string, nextValue: string | string[]) {
    onChange({
      ...value,
      [key]: nextValue,
    });
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{title}</h2>
          <p style={styles.subtitle}>
            Configure your Red Label jacket and trouser with grouped workshop options.
          </p>
        </div>

        <div style={styles.priceBox}>
          <div style={styles.priceLabel}>Current Upcharge</div>
          <div style={styles.priceValue}>
            {currencySymbol}
            {pricing.total.toFixed(2)}
          </div>
        </div>
      </div>

      {groupedBySection.map(([sectionKey, options]) => (
        <section key={sectionKey} style={styles.section}>
          <h3 style={styles.sectionTitle}>{sectionLabels[sectionKey] || sectionKey}</h3>

          <div style={styles.optionStack}>
            {options.map((option) => {
              const recommended = recommendedKeys.includes(option.key);

              if (option.type === 'group') {
                const childOptions = getVisibleRedLabelChildOptionsByGroup(
                  option.key,
                  value,
                );

                return (
                  <GroupAccordion
                    key={option.key}
                    option={option}
                    childOptions={childOptions}
                    selections={value}
                    onChange={updateValue}
                    currencySymbol={currencySymbol}
                    recommended={recommended}
                  />
                );
              }

              return (
                <SingleOptionCard
                  key={option.key}
                  option={option}
                  selectedValue={value[option.key]}
                  onChange={updateValue}
                  currencySymbol={currencySymbol}
                  recommended={recommended}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function GroupAccordion({
  option,
  childOptions,
  selections,
  onChange,
  currencySymbol,
  recommended,
}: {
  option: TopLevelGroupedOption;
  childOptions: ChildOption[];
  selections: SuitRedLabelSelections;
  onChange: (key: string, value: string | string[]) => void;
  currencySymbol: string;
  recommended: boolean;
}) {
  const summary = useMemo(() => {
    const parts: string[] = [];

    for (const child of childOptions) {
      const selected = selections[child.key];
      if (typeof selected !== 'string') continue;

      const label = child.choices?.find((choice) => choice.value === selected)?.label ?? selected;

      if (selected && label) parts.push(label);
    }

    return parts.slice(0, 3).join(' · ');
  }, [childOptions, selections]);

  return (
    <details style={styles.groupCard}>
      <summary style={styles.groupSummary}>
        <div>
          <div style={styles.groupTitleRow}>
            <span style={styles.optionLabel}>
              {option.label}
              {option.required ? <span style={styles.required}> *</span> : null}
            </span>
            {recommended ? <span style={styles.recommended}>Recommended</span> : null}
          </div>
          <div style={styles.optionMeta}>{summary || 'Open to configure'}</div>
        </div>
        <span style={styles.groupHint}>Expand</span>
      </summary>

      <div style={styles.groupBody}>
        {childOptions.length === 0 ? (
          <div style={styles.emptyGroup}>
            No child options are available yet for this selection.
          </div>
        ) : (
          <div style={styles.childStack}>
            {childOptions.map((child) => (
              <ChildOptionRenderer
                key={child.key}
                option={child}
                selectedValue={selections[child.key]}
                onChange={onChange}
                currencySymbol={currencySymbol}
              />
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

function SingleOptionCard({
  option,
  selectedValue,
  onChange,
  currencySymbol,
  recommended,
}: {
  option: TopLevelGroupedOption;
  selectedValue: string | string[] | undefined;
  onChange: (key: string, value: string | string[]) => void;
  currencySymbol: string;
  recommended: boolean;
}) {
  return (
    <div style={styles.optionCard}>
      <div style={styles.optionHeader}>
        <div>
          <div style={styles.groupTitleRow}>
            <div style={styles.optionLabel}>
              {option.label}
              {option.required ? <span style={styles.required}> *</span> : null}
            </div>
            {recommended ? <span style={styles.recommended}>Recommended</span> : null}
          </div>
          <div style={styles.optionMeta}>{renderOptionTypeLabel(option.uiHint)}</div>
        </div>
      </div>

      <OptionInput
        optionKey={option.key}
        uiHint={option.uiHint}
        choices={option.choices || []}
        value={selectedValue}
        onChange={onChange}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}

function ChildOptionRenderer({
  option,
  selectedValue,
  onChange,
  currencySymbol,
}: {
  option: ChildOption;
  selectedValue: string | string[] | undefined;
  onChange: (key: string, value: string | string[]) => void;
  currencySymbol: string;
}) {
  return (
    <div style={styles.childOptionCard}>
      <div style={styles.childHeader}>
        <div style={styles.optionLabel}>{option.label}</div>
      </div>

      <OptionInput
        optionKey={option.key}
        uiHint={option.uiHint}
        choices={option.choices || []}
        value={selectedValue}
        onChange={onChange}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}

function OptionInput({
  optionKey,
  uiHint,
  choices,
  value,
  onChange,
  currencySymbol,
}: {
  optionKey: string;
  uiHint: MtmUiHint;
  choices: MtmChoice[];
  value: string | string[] | undefined;
  onChange: (key: string, value: string | string[]) => void;
  currencySymbol: string;
}) {
  const singleValue = Array.isArray(value) ? '' : value || '';

  if (uiHint === 'cards') {
    return (
      <div style={styles.cardsGrid}>
        {choices.map((choice) => {
          const active = singleValue === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => onChange(optionKey, choice.value)}
              style={{
                ...styles.choiceCard,
                ...(active ? styles.choiceCardActive : {}),
              }}
            >
              <div style={styles.assetPlaceholder}>
                <span style={styles.assetPlaceholderText}>Image / Diagram</span>
              </div>
              <div style={styles.choiceTitle}>{choice.label}</div>
              <InlinePriceDelta
                amount={choice.priceDelta || 0}
                currencySymbol={currencySymbol}
              />
            </button>
          );
        })}
      </div>
    );
  }

  if (uiHint === 'buttons') {
    return (
      <div style={styles.buttonGroup}>
        {choices.map((choice) => {
          const active = singleValue === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => onChange(optionKey, choice.value)}
              style={{
                ...styles.choiceButton,
                ...(active ? styles.choiceButtonActive : {}),
              }}
            >
              <span>{choice.label}</span>
              <span style={styles.choiceButtonPrice}>
                <InlinePriceDelta
                  amount={choice.priceDelta || 0}
                  currencySymbol={currencySymbol}
                />
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (uiHint === 'dropdown') {
    return (
      <select
        value={singleValue}
        onChange={(event) => onChange(optionKey, event.target.value)}
        style={styles.select}
      >
        <option value="">Select option</option>
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
            {(choice.priceDelta || 0) > 0
              ? ` (+${currencySymbol}${(choice.priceDelta || 0).toFixed(2)})`
              : ''}
          </option>
        ))}
      </select>
    );
  }

  if (uiHint === 'text') {
    return (
      <input
        type="text"
        value={singleValue}
        onChange={(event) => onChange(optionKey, event.target.value)}
        placeholder="Enter value"
        style={styles.textInput}
      />
    );
  }

  return <div style={styles.emptyGroup}>Unsupported input type.</div>;
}

function InlinePriceDelta({
  amount,
  currencySymbol,
}: {
  amount: number;
  currencySymbol: string;
}) {
  if (!amount) return <span style={styles.inlineIncluded}>Included</span>;
  return (
    <span>
      +{currencySymbol}
      {amount.toFixed(2)}
    </span>
  );
}

function renderOptionTypeLabel(uiHint: string) {
  if (uiHint === 'cards') return 'Choose one';
  if (uiHint === 'buttons') return 'Select an option';
  if (uiHint === 'dropdown') return 'Select from list';
  if (uiHint === 'text') return 'Enter value';
  if (uiHint === 'accordion') return 'Open grouped settings';
  return uiHint;
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: 'grid',
    gap: 20,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.1,
    fontWeight: 700,
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#666',
    fontSize: 14,
  },
  priceBox: {
    border: '1px solid #e5e5e5',
    borderRadius: 14,
    padding: '12px 14px',
    minWidth: 180,
    background: '#fafafa',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: 700,
  },
  section: {
    borderTop: '1px solid #eee',
    paddingTop: 20,
  },
  sectionTitle: {
    margin: '0 0 14px',
    fontSize: 18,
    fontWeight: 700,
  },
  optionStack: {
    display: 'grid',
    gap: 14,
  },
  optionCard: {
    border: '1px solid #e8e8e8',
    borderRadius: 16,
    padding: 16,
    background: '#fff',
  },
  optionHeader: {
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 600,
  },
  required: {
    color: '#a00',
  },
  optionMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
  },
  groupCard: {
    border: '1px solid #e8e8e8',
    borderRadius: 16,
    background: '#fff',
    overflow: 'hidden',
  },
  groupSummary: {
    listStyle: 'none',
    cursor: 'pointer',
    padding: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  groupBody: {
    padding: '0 16px 16px',
    borderTop: '1px solid #f0f0f0',
  },
  groupTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  groupHint: {
    fontSize: 12,
    color: '#777',
  },
  recommended: {
    fontSize: 11,
    border: '1px solid #ddd',
    padding: '2px 8px',
    borderRadius: 999,
    color: '#444',
    background: '#fafafa',
  },
  childStack: {
    display: 'grid',
    gap: 12,
    marginTop: 14,
  },
  childOptionCard: {
    border: '1px solid #f0f0f0',
    borderRadius: 12,
    padding: 12,
    background: '#fcfcfc',
  },
  childHeader: {
    marginBottom: 10,
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
  },
  choiceCard: {
    textAlign: 'left',
    border: '1px solid #ddd',
    borderRadius: 14,
    padding: 14,
    background: '#fff',
    cursor: 'pointer',
    minHeight: 160,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 10,
  },
  choiceCardActive: {
    border: '1px solid #111',
    boxShadow: '0 0 0 1px #111 inset',
    background: '#fcfcfc',
  },
  assetPlaceholder: {
    border: '1px dashed #ccc',
    borderRadius: 10,
    height: 72,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fafafa',
  },
  assetPlaceholderText: {
    fontSize: 12,
    color: '#999',
  },
  choiceTitle: {
    fontWeight: 600,
    fontSize: 14,
    lineHeight: 1.3,
  },
  buttonGroup: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  choiceButton: {
    border: '1px solid #ddd',
    borderRadius: 999,
    padding: '10px 14px',
    background: '#fff',
    cursor: 'pointer',
    display: 'inline-flex',
    gap: 8,
    alignItems: 'center',
    fontSize: 14,
  },
  choiceButtonActive: {
    border: '1px solid #111',
    background: '#111',
    color: '#fff',
  },
  choiceButtonPrice: {
    opacity: 0.8,
    fontSize: 12,
  },
  inlineIncluded: {
    opacity: 0.7,
  },
  select: {
    width: '100%',
    border: '1px solid #ddd',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 14,
    background: '#fff',
  },
  textInput: {
    width: '100%',
    border: '1px solid #ddd',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 14,
    background: '#fff',
  },
  emptyGroup: {
    color: '#777',
    fontSize: 13,
  },
};