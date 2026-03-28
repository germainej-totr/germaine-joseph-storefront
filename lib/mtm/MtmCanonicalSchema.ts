import { z } from 'zod';
import type { MtmCategory, MtmSpec } from '../../types/mtm.ts';
import { MTM_CANONICAL_VERSION_CURRENT } from './MtmCanonicalVersion.ts';

/**
 * Generic design snapshot for any MTM category
 * Contains selections, pricing, and validation state
 */
export const MTM_DESIGN_SNAPSHOT_SCHEMA = z
  .object({
    category: z.enum(['trouser', 'jacket', 'shirt', 'suit', 'overcoat', 'blazer', 'vest'] as const),
    optionSet: z.string(),
    optionSetVersion: z.string(),
    selections: z.record(z.string(), z.string()),
    pricing: z.object({
      total: z.number().nonnegative(),
      breakdown: z
        .array(
          z.object({
            key: z.string(),
            label: z.string(),
            amount: z.number(),
          }),
        )
        .optional(),
    }),
    validation: z
      .object({
        isValid: z.boolean(),
        errors: z.array(z.string()).optional(),
      })
      .optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  })
  .nullable();

/**
 * Fit profile context snapshot
 * Captures customer fit information and appointment details
 */
export const MTM_FIT_PROFILE_SCHEMA = z.object({
  email: z.string().email(),
  fitPreference: z.string(),
  jacketSize: z.number().int().positive().optional(),
  trouserSize: z.number().int().positive().optional(),
  appointmentDate: z.string().date().optional(),
  appointmentTime: z.string().optional(),
  fitProfileId: z.string().optional(),
  bookingId: z.string().optional(),
  customerId: z.string().optional(),
  fitGateVersion: z.string().optional(),
});

/**
 * Fit attributes and specifications - allows any properties
 */
export const MTM_FIT_CONTEXT_SCHEMA = z.object({}).passthrough().optional();

/**
 * Immutable MTM specification snapshot
 */
export const MTM_SPEC_SCHEMA = z.object({
  category: z.enum(['suit', 'shirt', 'trouser', 'overcoat', 'blazer', 'vest', 'jacket'] as const),
  fabricCode: z.string().optional(),
  options: z.record(z.string(), z.string()),
  measurements: z.record(z.string(), z.number()),
  notes: z.string().optional(),
  fitGateVersion: z.string().optional(),
  fitProfileId: z.string().optional(),
});

/**
 * Line item properties for Shopify cart
 */
export const MTM_LINE_ITEM_PROPERTIES_SCHEMA = z.record(z.string(), z.string());

/**
 * Generic canonical MTM payload
 * Carries complete MTM context through design, fit, booking, commerce, and order systems
 */
export const MTM_CANONICAL_PAYLOAD_SCHEMA = z.object({
  // Version contract
  version: z.string().default(MTM_CANONICAL_VERSION_CURRENT),

  // Core identifiers
  id: z.string().optional(),
  category: z.enum(['suit', 'shirt', 'trouser', 'overcoat', 'blazer', 'vest', 'jacket'] as const),

  // Lifecycle metadata
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().optional(),

  // Fit context
  fitProfile: MTM_FIT_PROFILE_SCHEMA,

  // Design snapshot
  design: MTM_DESIGN_SNAPSHOT_SCHEMA,

  // Fit measurements and attributes
  fit: MTM_FIT_CONTEXT_SCHEMA.optional(),

  // Immutable specification
  mtmSpec: MTM_SPEC_SCHEMA,

  // Shopify integration
  lineItemProperties: MTM_LINE_ITEM_PROPERTIES_SCHEMA.optional(),

  // Extensible metadata for future versions
  metadata: z.object({}).passthrough().optional(),
});

export type MtmCanonicalPayload = z.infer<typeof MTM_CANONICAL_PAYLOAD_SCHEMA>;

/**
 * Strict version of canonical payload (requires version field)
 * Used for persistence and validation
 */
export const MTM_CANONICAL_PAYLOAD_STRICT_SCHEMA = MTM_CANONICAL_PAYLOAD_SCHEMA.extend({
  version: z.string(),
  createdAt: z.string().datetime(),
  id: z.string(),
});

export type MtmCanonicalPayloadStrict = z.infer<typeof MTM_CANONICAL_PAYLOAD_STRICT_SCHEMA>;
