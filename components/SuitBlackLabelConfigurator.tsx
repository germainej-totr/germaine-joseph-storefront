'use client';

import { useMemo, type CSSProperties } from 'react';
import {
  getVisibleSuitBlackLabelOptions,
  applySuitBlackLabelRules,
  type MtmOption,
  type MtmChoice,
} from '@/src/lib/mtm/suitBlackLabelOptions';

export type SuitBlackLabelSelections = Record<
  string,
  string | string[] | undefined
>;

type Props = {
  value: SuitBlackLabelSelections;
  onChange: (next: SuitBlackLabelSelections) => void;
  currencySymbol?: string;
  title?: string;
};

const sectionLabels: Record<string, string> = {
  design: 'Design',
  jacket_design: 'Jacket Design',
  jacket_construction: 'Jacket Construction',
  jacket_pockets: 'Jacket Pockets',
  jacket_details: 'Jacket Details',
  jacket_interior: 'Jacket Interior',
  jacket_personalisation: 'Jacket Personalisation',
  trouser_design: 'Trouser Design',
  trouser_construction: 'Trouser Construction',
  trouser_pockets: 'Trouser Pockets',
  trouser_details: 'Trouser Details',
  trouser_finish: 'Trouser Finish',
};

export default function SuitBlackLabelConfigurator({
  value,
  onChange,
  currencySymbol = '$',
  title = 'Suit Black Label Configuration',
}: Props) {
  const normalizedValue = useMemo(
    () => applySuitBlackLabelRules(value),
    [value],
  );

  const visibleOptions = useMemo(
    () => getVisibleSuitBlackLabelOptions(normalizedValue),
    [normalizedValue],
  );

  const groupedOptions = useMemo(() => {
    const groups = new Map<string, MtmOption[]>();

    for (const option of visibleOptions) {
      const group = groups.get(option.section) || [];
      group.push(option);
      groups.set(option.section, group);
    }

    return Array.from(groups.entries());
  }, [visibleOptions]);

  const totalPriceDelta = useMemo(() => {
    let total = 0;

    for (const option of visibleOptions) {
      const selectedValue = normalizedValue[option.key];
      if (!option.choices) continue;

      if (Array.isArray(selectedValue)) {
        for (const valueEntry of selectedValue) {
          const selectedChoice = option.choices.find((choice) => choice.value === valueEntry);
          total += selectedChoice?.priceDelta || 0;
        }
      } else if (typeof selectedValue === 'string') {
        const selectedChoice = option.choices.find(
          (choice) => choice.value === selectedValue,
        );
        total += selectedChoice?.priceDelta || 0;
      }
    }

    return total;
  }, [visibleOptions, normalizedValue]);

  function setSelection(optionKey: string, nextValue: string | string[]) {
    const next = applySuitBlackLabelRules({
      ...normalizedValue,
      [optionKey]: nextValue,
    });

    onChange(next);
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{title}</h2>
          <p style={styles.subtitle}>
            Configure your jacket and trouser details for Sartoria Black Label.
          </p>
        </div>

        <div style={styles.priceBox}>
          <div style={styles.priceLabel}>Design Upcharge</div>
          <div style={styles.priceValue}>
            {currencySymbol}
            {totalPriceDelta.toFixed(2)}
          </div>
        </div>
      </div>

      {groupedOptions.map(([section, options]) => (
        <section key={section} style={styles.section}>
          <h3 style={styles.sectionTitle}>{sectionLabels[section] || section}</h3>

          <div style={styles.optionStack}>
            {options.map((option) => (
              <OptionRenderer
                key={option.key}
                option={option}
                selectedValue={normalizedValue[option.key]}
                onChange={(nextValue) => setSelection(option.key, nextValue)}
                currencySymbol={currencySymbol}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function OptionRenderer({
  option,
  selectedValue,
  onChange,
  currencySymbol,
}: {
  option: MtmOption;
  selectedValue: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  currencySymbol: string;
}) {
  const selected = Array.isArray(selectedValue) ? undefined : selectedValue;
  const selectedMany = Array.isArray(selectedValue) ? selectedValue : [];

  return (
    <div style={styles.optionCard}>
      <div style={styles.optionHeader}>
        <div>
          <div style={styles.optionLabel}>
            {option.label}
            {option.required ? <span style={styles.required}> *</span> : null}
          </div>
          <div style={styles.optionMeta}>{renderOptionTypeLabel(option)}</div>
          {option.helpText ? (
            <div style={styles.helpText}>{option.helpText}</div>
          ) : null}
        </div>
      </div>

      {option.uiHint === 'cards' ? (
        <ChoiceCards
          choices={option.choices || []}
          selected={selected}
          onChange={(value) => onChange(value)}
          currencySymbol={currencySymbol}
        />
      ) : option.uiHint === 'buttons' && option.type !== 'multiselect' ? (
        <ChoiceButtons
          choices={option.choices || []}
          selected={selected}
          onChange={(value) => onChange(value)}
          currencySymbol={currencySymbol}
        />
      ) : option.uiHint === 'buttons' && option.type === 'multiselect' ? (
        <ChoiceMultiButtons
          choices={option.choices || []}
          selected={selectedMany}
          onChange={(value) => onChange(value)}
          currencySymbol={currencySymbol}
        />
      ) : option.uiHint === 'dropdown' ? (
        <ChoiceSelect
          label={option.label}
          choices={option.choices || []}
          selected={selected}
          onChange={(value) => onChange(value)}
          currencySymbol={currencySymbol}
        />
      ) : option.uiHint === 'number' || option.type === 'number' ? (
        <NumberInput
          label={option.label}
          value={typeof selectedValue === 'string' ? selectedValue : ''}
          onChange={(value) => onChange(value)}
        />
      ) : option.uiHint === 'text' ? (
        <TextInput
          label={option.label}
          value={typeof selectedValue === 'string' ? selectedValue : ''}
          onChange={(value) => onChange(value)}
        />
      ) : null}
    </div>
  );
}

function ChoiceCards({
  choices,
  selected,
  onChange,
  currencySymbol,
}: {
  choices: MtmChoice[];
  selected?: string;
  onChange: (value: string) => void;
  currencySymbol: string;
}) {
  return (
    <div style={styles.cardsGrid}>
      {choices.map((choice) => {
        const active = selected === choice.value;

        return (
          <button
            key={choice.value}
            type="button"
            onClick={() => onChange(choice.value)}
            style={{
              ...styles.choiceCard,
              ...(active ? styles.choiceCardActive : {}),
            }}
          >
            <div style={styles.assetPlaceholder}>
              <span style={styles.assetPlaceholderText}>
                {choice.image ? 'Image Ready' : 'Image / Diagram'}
              </span>
            </div>

            <div style={styles.choiceTitle}>{choice.label}</div>

            <PriceDelta
              amount={choice.priceDelta || 0}
              currencySymbol={currencySymbol}
            />
          </button>
        );
      })}
    </div>
  );
}

function ChoiceButtons({
  choices,
  selected,
  onChange,
  currencySymbol,
}: {
  choices: MtmChoice[];
  selected?: string;
  onChange: (value: string) => void;
  currencySymbol: string;
}) {
  return (
    <div style={styles.buttonGroup}>
      {choices.map((choice) => {
        const active = selected === choice.value;

        return (
          <button
            key={choice.value}
            type="button"
            onClick={() => onChange(choice.value)}
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

function ChoiceMultiButtons({
  choices,
  selected,
  onChange,
  currencySymbol,
}: {
  choices: MtmChoice[];
  selected: string[];
  onChange: (value: string[]) => void;
  currencySymbol: string;
}) {
  return (
    <div style={styles.buttonGroup}>
      {choices.map((choice) => {
        const active = selected.includes(choice.value);

        return (
          <button
            key={choice.value}
            type="button"
            onClick={() => {
              const next = active
                ? selected.filter((valueEntry) => valueEntry !== choice.value)
                : [...selected, choice.value];
              onChange(next);
            }}
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

function ChoiceSelect({
  label,
  choices,
  selected,
  onChange,
  currencySymbol,
}: {
  label: string;
  choices: MtmChoice[];
  selected?: string;
  onChange: (value: string) => void;
  currencySymbol: string;
}) {
  return (
    <label style={styles.selectWrap}>
      <span style={styles.visuallyHidden}>{label}</span>
      <select
        value={selected || ''}
        onChange={(event) => onChange(event.target.value)}
        style={styles.select}
      >
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
            {(choice.priceDelta || 0) > 0
              ? ` (+${currencySymbol}${(choice.priceDelta || 0).toFixed(2)})`
              : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={styles.selectWrap}>
      <span style={styles.visuallyHidden}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
        style={styles.textInput}
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={styles.selectWrap}>
      <span style={styles.visuallyHidden}>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
        style={styles.textInput}
      />
    </label>
  );
}

function PriceDelta({
  amount,
  currencySymbol,
}: {
  amount: number;
  currencySymbol: string;
}) {
  if (!amount) return <div style={styles.priceDeltaMuted}>Included</div>;

  return (
    <div style={styles.priceDelta}>
      +{currencySymbol}
      {amount.toFixed(2)}
    </div>
  );
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

function renderOptionTypeLabel(option: MtmOption) {
  if (option.uiHint === 'cards') return 'Choose one';
  if (option.uiHint === 'buttons' && option.type === 'multiselect') {
    return 'Select one or more';
  }
  if (option.uiHint === 'buttons') return 'Select an option';
  if (option.uiHint === 'dropdown') return 'Select from list';
  if (option.uiHint === 'text') return 'Enter value';
  if (option.uiHint === 'number' || option.type === 'number') return 'Enter number';
  return option.type;
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
  helpText: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
    lineHeight: 1.4,
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
  priceDelta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: 600,
  },
  priceDeltaMuted: {
    marginTop: 4,
    fontSize: 13,
    color: '#777',
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
  selectWrap: {
    display: 'block',
    position: 'relative',
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
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    border: 0,
  },
};