// lib/tailor-engine.ts

export interface MeasurementRule {
  label: string;
  tooltip: string;
  min_cm: number;
  max_cm: number;
}

export interface MeasurementGuide {
  [key: string]: MeasurementRule;
}

/**
 * Validates a user's measurement against the Shopify Metaobject rules
 */
export const validateMeasurement = (
  key: string, 
  value: number, 
  guide: MeasurementGuide
) => {
  const rule = guide[key];
  if (!rule) return { isValid: true };

  if (value < rule.min_cm) {
    return { 
      isValid: false, 
      error: `${rule.label} is below the technical minimum for a bespoke fit.` 
    };
  }

  if (value > rule.max_cm) {
    return { 
      isValid: false, 
      error: `${rule.label} exceeds the technical maximum for this pattern.` 
    };
  }

  return { isValid: true };
};