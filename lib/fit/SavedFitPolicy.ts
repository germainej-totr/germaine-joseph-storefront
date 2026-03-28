import type { MtmCategory } from '@/types/mtm';

// ---------------------------------------------------------------------------
// Rule outcome types
// ---------------------------------------------------------------------------

/**
 * Which path the customer must take for this fit profile.
 *
 * - `saved_fit_allowed`   — profile is fresh and owned; reuse without interruption
 * - `refit_recommended`   — profile is stale; customer should confirm or refresh
 * - `refit_required`      — hard block: profile is missing, wrong owner, or wrong category
 */
export type SavedFitOutcome =
  | 'saved_fit_allowed'
  | 'refit_recommended'
  | 'refit_required';

/**
 * Reason codes used for audit trail and UI copy decisions.
 */
export type SavedFitReasonCode =
  | 'profile_fresh'
  | 'profile_stale'
  | 'profile_very_stale'
  | 'missing_profile'
  | 'ownership_mismatch'
  | 'category_mismatch'
  | 'profile_inactive'
  | 'measurements_incomplete';

export interface SavedFitPolicyResult {
  outcome: SavedFitOutcome;
  reason: SavedFitReasonCode;
  profileAgeMonths: number | null;
  /** Human-readable explanation for the UI */
  message: string;
  /** Whether customerconfirmation is required before proceeding */
  requiresConfirmation: boolean;
}

// ---------------------------------------------------------------------------
// Policy input
// ---------------------------------------------------------------------------

export interface SavedFitPolicyInput {
  /** Current authenticated customer email */
  currentEmail: string;
  /** Email on the saved fit profile */
  profileEmail: string;
  /** Last time profile was meaningfully updated */
  profileUpdatedAt: string | Date | null;
  /** Whether the profile is marked active in the DB */
  profileIsActive: boolean;
  /** Category the customer is currently shopping for */
  requestedCategory: MtmCategory;
  /** Categories the saved fit profile was collected for */
  profileCategories: MtmCategory[];
  /** Whether key measurements exist on the profile */
  hasMeasurements: boolean;
  // --- Policy tuning (override in tests or admin flags) ---
  /** Months before a profile is considered stale (default: 6) */
  staleThresholdMonths?: number;
  /** Months before a profile is considered very stale / hard-block (default: 18) */
  veryStaleThresholdMonths?: number;
}

// ---------------------------------------------------------------------------
// Rule engine helpers
// ---------------------------------------------------------------------------

function monthsBetween(from: Date, to: Date): number {
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  return Math.max(0, years * 12 + months);
}

function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Policy evaluation — pure function, fully testable
// ---------------------------------------------------------------------------

/**
 * Evaluate saved-fit reuse eligibility according to the A17 policy rules.
 *
 * Rules are evaluated in priority order (first match wins):
 *  1. Ownership mismatch  → refit_required
 *  2. Profile inactive    → refit_required
 *  3. Missing profile / no measurements → refit_required
 *  4. Category mismatch   → refit_required
 *  5. Very stale (≥ veryStaleThresholdMonths) → refit_required
 *  6. Stale (≥ staleThresholdMonths)          → refit_recommended (confirm)
 *  7. Fresh                                    → saved_fit_allowed
 */
export function evaluateSavedFitPolicy(
  input: SavedFitPolicyInput,
): SavedFitPolicyResult {
  const staleThreshold = input.staleThresholdMonths ?? 6;
  const veryStaleThreshold = input.veryStaleThresholdMonths ?? 18;

  // --- Rule 1: Ownership mismatch ---
  if (
    input.currentEmail.trim().toLowerCase() !==
    input.profileEmail.trim().toLowerCase()
  ) {
    return {
      outcome: 'refit_required',
      reason: 'ownership_mismatch',
      profileAgeMonths: null,
      message:
        'This fit profile belongs to a different account and cannot be reused.',
      requiresConfirmation: false,
    };
  }

  // --- Rule 2: Inactive profile ---
  if (!input.profileIsActive) {
    return {
      outcome: 'refit_required',
      reason: 'profile_inactive',
      profileAgeMonths: null,
      message:
        'Your saved fit profile is no longer active. Please create a new one.',
      requiresConfirmation: false,
    };
  }

  // --- Rule 3: Missing profile / measurements ---
  if (!input.hasMeasurements) {
    return {
      outcome: 'refit_required',
      reason: 'measurements_incomplete',
      profileAgeMonths: null,
      message:
        'Your fit profile is incomplete. Please book a fitting to add your measurements.',
      requiresConfirmation: false,
    };
  }

  // --- Rule 4: Category mismatch ---
  if (!input.profileCategories.includes(input.requestedCategory)) {
    return {
      outcome: 'refit_required',
      reason: 'category_mismatch',
      profileAgeMonths: null,
      message: `Your saved profile does not include measurements for ${input.requestedCategory}. A fitting is required.`,
      requiresConfirmation: false,
    };
  }

  // --- Rules 5–7: Age-based ---
  const profileDate = parseDate(input.profileUpdatedAt);

  if (!profileDate) {
    // Unknown age — treat as stale, prompt confirmation
    return {
      outcome: 'refit_recommended',
      reason: 'profile_stale',
      profileAgeMonths: null,
      message:
        'We could not verify when your fit profile was last updated. We recommend confirming your measurements are still accurate.',
      requiresConfirmation: true,
    };
  }

  const ageMonths = monthsBetween(profileDate, new Date());

  // Rule 5: Very stale — hard block
  if (ageMonths >= veryStaleThreshold) {
    return {
      outcome: 'refit_required',
      reason: 'profile_very_stale',
      profileAgeMonths: ageMonths,
      message: `Your fit profile is ${ageMonths} months old. For best results, a fresh fitting is required.`,
      requiresConfirmation: false,
    };
  }

  // Rule 6: Stale — soft prompt
  if (ageMonths >= staleThreshold) {
    return {
      outcome: 'refit_recommended',
      reason: 'profile_stale',
      profileAgeMonths: ageMonths,
      message: `Your fit profile is ${ageMonths} months old. Body changes can affect fit — we recommend confirming your measurements.`,
      requiresConfirmation: true,
    };
  }

  // Rule 7: Fresh
  return {
    outcome: 'saved_fit_allowed',
    reason: 'profile_fresh',
    profileAgeMonths: ageMonths,
    message: 'Your fit profile is current. You can proceed with your saved fit.',
    requiresConfirmation: false,
  };
}
