import { randomUUID as uuidv4 } from 'crypto';
import type { MtmCategory, MtmCanonicalPayload } from '@/types/mtm';
import { getCategoryMtmConfig } from './CategoryMtmConfig';
import type { CategorySelections } from './CategoryMtmConfig';

/**
 * Generic canonical MTM payload builder
 * Works with any MTM category
 */

export interface BuildGenericMtmPayloadInput {
  category: MtmCategory;
  email: string;
  fitPreference: string;
  fitProfileId?: string;
  bookingId?: string;
  jacketSize?: number;
  trouserSize?: number;
  appointmentDate?: string;
  appointmentTime?: string;
  selections: CategorySelections;
  attributes: Record<string, unknown>;
  preferences: Record<string, unknown>;
  specs: Record<string, unknown>;
  designSnapshot?: {
    optionSet: string;
    optionSetVersion: string;
    selections: CategorySelections;
    pricing?: {
      total: number;
      breakdown?: Array<{
        key: string;
        label: string;
        amount: number;
      }>;
    };
    validation?: {
      isValid: boolean;
      errors?: string[];
    };
  };
}

/**
 * Extract measurements from attributes
 */
function extractMeasurements(attributes: Record<string, unknown>): Record<string, number> {
  const measurements: Record<string, number> = {};
  const keys = ['chest', 'stomach', 'waist', 'hips', 'height', 'weight', 'shoulder', 'sleeve'];

  for (const key of keys) {
    const value = attributes[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      measurements[key] = value;
    }
  }

  return measurements;
}

/**
 * Build a generic canonical MTM payload for any category
 */
export function buildGenericMtmPayload(
  input: BuildGenericMtmPayloadInput,
): MtmCanonicalPayload {
  const config = getCategoryMtmConfig(input.category);
  const createdAt = new Date().toISOString();
  const id = `canonical_${input.category}_${uuidv4()}`;

  const fitProfileId = input.fitProfileId || input.bookingId;

  const payload: MtmCanonicalPayload = {
    version: 'v1',
    id,
    category: input.category,
    createdAt,
    createdBy: input.email,

    fitProfile: {
      email: input.email,
      fitPreference: input.fitPreference,
      jacketSize: input.jacketSize,
      trouserSize: input.trouserSize,
      appointmentDate: input.appointmentDate,
      appointmentTime: input.appointmentTime,
      fitProfileId,
      fitGateVersion: config.optionSet.version || 'v1',
    },

    design: input.designSnapshot
      ? {
          category: input.category,
          optionSet: input.designSnapshot.optionSet,
          optionSetVersion: input.designSnapshot.optionSetVersion,
          selections: Object.fromEntries(
            Object.entries(input.designSnapshot.selections).filter(
              (e): e is [string, string] => e[1] !== undefined,
            ),
          ),
          pricing: input.designSnapshot.pricing || {
            total: config.pricing.basePriceEur,
            breakdown: [],
          },
          validation: input.designSnapshot.validation || {
            isValid: true,
            errors: [],
          },
          createdAt,
        }
      : null,

    fit: {
      attributes: input.attributes,
      preferences: input.preferences,
      measurements: extractMeasurements(input.attributes),
      jacketSpecs: input.category === 'jacket' ? input.specs : undefined,
      trouserSpecs: input.category === 'trouser' ? input.specs : undefined,
    },

    mtmSpec: {
      category: input.category,
      options: Object.fromEntries(
        Object.entries(input.selections).filter((e): e is [string, string] => e[1] !== undefined),
      ),
      measurements: extractMeasurements(input.attributes),
      notes: `FitPreference=${input.fitPreference}; Appointment=${input.appointmentDate} ${input.appointmentTime || ''}`,
      fitGateVersion: config.optionSet.version || 'v1',
      fitProfileId,
    },

    metadata: {
      configuredBy: input.email,
      configurationTime: createdAt,
      categoryDisplayName: config.displayName,
    },
  };

  return payload;
}

/**
 * Build category-specific payload with specialized handling
 * This is a convenience function that can be overridden per category
 */
export function buildCategorySpecificPayload(
  input: BuildGenericMtmPayloadInput,
): MtmCanonicalPayload {
  switch (input.category) {
    case 'trouser':
      return buildGenericMtmPayload(input);
    case 'jacket':
      return buildGenericMtmPayload(input);
    case 'shirt':
      return buildGenericMtmPayload(input);
    // Add category-specific builders as implemented
    default:
      return buildGenericMtmPayload(input);
  }
}
