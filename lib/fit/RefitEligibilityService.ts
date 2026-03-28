import 'server-only';

import type { MtmCategory } from '@/types/mtm';
import type { FitProfileSummary } from '@/lib/fit/FitProfileSchema';
import type { FitProfileOwnerContext } from '@/lib/fit/FitProfileService';
import {
  evaluateSavedFitPolicy,
  type SavedFitPolicyResult,
  type SavedFitPolicyInput,
} from '@/lib/fit/SavedFitPolicy';

// ---------------------------------------------------------------------------
// Serialisable audit record
// ---------------------------------------------------------------------------

export interface RefitEligibilityRecord {
  evaluatedAt: string;
  requestedCategory: MtmCategory;
  profileId: string | null;
  profileEmail: string | null;
  currentEmail: string;
  policy: SavedFitPolicyResult;
}

// ---------------------------------------------------------------------------
// Service public API
// ---------------------------------------------------------------------------

/**
 * Evaluate whether a customer can reuse their saved fit for a given MTM category.
 *
 * Designed to be called inside Server Components or API routes — depends on
 * `server-only` so it is never bundled in the browser.
 */
export async function checkRefitEligibility(
  owner: FitProfileOwnerContext,
  profile: FitProfileSummary | null,
  requestedCategory: MtmCategory,
  options?: {
    staleThresholdMonths?: number;
    veryStaleThresholdMonths?: number;
  },
): Promise<RefitEligibilityRecord> {
  const evaluatedAt = new Date().toISOString();

  // No profile at all
  if (!profile) {
    const result: SavedFitPolicyResult = {
      outcome: 'refit_required',
      reason: 'missing_profile',
      profileAgeMonths: null,
      message:
        'No fit profile found. Please book a fitting or complete the fit questionnaire.',
      requiresConfirmation: false,
    };

    return {
      evaluatedAt,
      requestedCategory,
      profileId: null,
      profileEmail: null,
      currentEmail: owner.email,
      policy: result,
    };
  }

  // Determine which categories are represented in the saved profile
  const profileCategories = resolveProfileCategories(profile);

  // Determine whether key measurements are present
  const hasMeasurements = resolveMeasurementPresence(profile);

  const input: SavedFitPolicyInput = {
    currentEmail: owner.email,
    profileEmail: profile.email ?? owner.email,
    profileUpdatedAt: profile.updatedAt,
    profileIsActive: profile.isActive,
    requestedCategory,
    profileCategories,
    hasMeasurements,
    staleThresholdMonths: options?.staleThresholdMonths,
    veryStaleThresholdMonths: options?.veryStaleThresholdMonths,
  };

  const policy = evaluateSavedFitPolicy(input);

  return {
    evaluatedAt,
    requestedCategory,
    profileId: profile.id,
    profileEmail: profile.email ?? null,
    currentEmail: owner.email,
    policy,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derive which MTM categories are present in categoryDefaults.
 * Falls back to all configured categories if none are stored.
 */
function resolveProfileCategories(profile: FitProfileSummary): MtmCategory[] {
  const defaults = profile.categoryDefaults ?? {};
  const populated = (Object.keys(defaults) as MtmCategory[]).filter(
    (k) => defaults[k as keyof typeof defaults] !== undefined,
  );

  // If no explicit category defaults, assume the profile covers all standard categories
  // (legacy profiles pre-dating the category defaults field)
  if (populated.length === 0) {
    return ['suit', 'shirt', 'trouser', 'overcoat', 'blazer', 'vest', 'jacket'];
  }

  return populated;
}

/**
 * Consider measurements "present" if technicalSpecs contains at least the basic
 * body measurement keys used by the MTM system.
 */
function resolveMeasurementPresence(profile: FitProfileSummary): boolean {
  const specs = profile.technicalSpecs as Record<string, unknown> | null | undefined;
  if (!specs || typeof specs !== 'object') return false;

  const requiredKeys = ['chest', 'waist'] as const;
  return requiredKeys.every(
    (k) => k in specs && specs[k] !== null && specs[k] !== undefined,
  );
}
