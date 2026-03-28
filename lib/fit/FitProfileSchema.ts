import { z } from 'zod';

export const FIT_PROFILE_CATEGORY_DEFAULTS_SCHEMA = z
  .object({
    jacket: z.object({ size: z.string().nullable().optional() }).optional(),
    trouser: z.object({ size: z.string().nullable().optional() }).optional(),
    shirt: z.object({ size: z.string().nullable().optional() }).optional(),
    suit: z.object({ size: z.string().nullable().optional() }).optional(),
    overcoat: z.object({ size: z.string().nullable().optional() }).optional(),
    blazer: z.object({ size: z.string().nullable().optional() }).optional(),
    vest: z.object({ size: z.string().nullable().optional() }).optional(),
  })
  .partial();

export const FIT_PROFILE_CREATE_SCHEMA = z.object({
  email: z.string().email().optional(),
  label: z.string().trim().min(1).max(120).optional(),
  categoryDefaults: FIT_PROFILE_CATEGORY_DEFAULTS_SCHEMA.optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  appointmentTime: z.string().min(1).max(32).optional(),
  fitPreference: z.string().trim().min(1).max(120).optional(),
  technicalSpecs: z.record(z.string(), z.unknown()).optional(),
});

export const FIT_PROFILE_UPDATE_SCHEMA = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  categoryDefaults: FIT_PROFILE_CATEGORY_DEFAULTS_SCHEMA.optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  appointmentTime: z.string().min(1).max(32).optional(),
  fitPreference: z.string().trim().min(1).max(120).nullable().optional(),
  technicalSpecs: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const FIT_PROFILE_SUMMARY_SCHEMA = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  customerId: z.string().optional(),
  email: z.string().email().optional(),
  categoryDefaults: FIT_PROFILE_CATEGORY_DEFAULTS_SCHEMA.default({}),
  fitPreference: z.string().nullable().optional(),
  appointmentDate: z.string().nullable().optional(),
  appointmentTime: z.string().nullable().optional(),
  technicalSpecs: z.unknown().optional(),
  isActive: z.boolean(),
  updatedAt: z.string(),
  version: z.number().int().nonnegative().default(1),
});

export const FIT_PROFILE_LIST_RESPONSE_SCHEMA = z.object({
  ok: z.literal(true),
  profiles: z.array(FIT_PROFILE_SUMMARY_SCHEMA),
  defaultFitProfileId: z.string().nullable().optional(),
});

export const FIT_PROFILE_DETAIL_RESPONSE_SCHEMA = z.object({
  ok: z.literal(true),
  profile: FIT_PROFILE_SUMMARY_SCHEMA,
});

export type FitProfileCreateInput = z.infer<typeof FIT_PROFILE_CREATE_SCHEMA>;
export type FitProfileUpdateInput = z.infer<typeof FIT_PROFILE_UPDATE_SCHEMA>;
export type FitProfileSummary = z.infer<typeof FIT_PROFILE_SUMMARY_SCHEMA>;
