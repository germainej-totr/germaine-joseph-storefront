'use client';

import type { SavedFitPolicyResult } from '@/lib/fit/SavedFitPolicy';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BodyChangeConfirmationProps {
  /** Policy result from RefitEligibilityService — drives copy and CTA labels */
  policy: SavedFitPolicyResult;
  /** Profile age label e.g. "Updated 7 months ago" */
  profileAgeLabel: string;
  /** Loading state during async operations */
  isLoading?: boolean;
  /** Customer chose to reuse their saved fit */
  onUseSavedFit: (decision: ConfirmationDecision) => void;
  /** Customer chose to book a new fitting */
  onBookNewFit: (decision: ConfirmationDecision) => void;
}

/** Serialisable audit record captured when the customer makes a decision */
export interface ConfirmationDecision {
  decidedAt: string;
  choice: 'use_saved_fit' | 'book_new_fit';
  policyOutcome: SavedFitPolicyResult['outcome'];
  policyReason: SavedFitPolicyResult['reason'];
  profileAgeMonths: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDecision(
  choice: ConfirmationDecision['choice'],
  policy: SavedFitPolicyResult,
): ConfirmationDecision {
  return {
    decidedAt: new Date().toISOString(),
    choice,
    policyOutcome: policy.outcome,
    policyReason: policy.reason,
    profileAgeMonths: policy.profileAgeMonths,
  };
}

// ---------------------------------------------------------------------------
// BodyChangeConfirmation
// ---------------------------------------------------------------------------

/**
 * Shown when SavedFitPolicy returns `refit_recommended`.
 * Captures an auditable customer confirmation decision.
 * Not shown for `refit_required` (hard block — no choice offered).
 * Not shown for `saved_fit_allowed` (silent pass-through).
 */
export default function BodyChangeConfirmation({
  policy,
  profileAgeLabel,
  isLoading = false,
  onUseSavedFit,
  onBookNewFit,
}: BodyChangeConfirmationProps) {
  function handleUseSaved() {
    if (isLoading) return;
    onUseSavedFit(buildDecision('use_saved_fit', policy));
  }

  function handleBookNew() {
    if (isLoading) return;
    onBookNewFit(buildDecision('book_new_fit', policy));
  }

  const isVeryStale = policy.reason === 'profile_very_stale';

  return (
    <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6">
      {/* Header */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700 select-none">
          Fit Profile Check
        </p>
        <h2 className="mt-2 font-serif text-xl text-gray-900">
          {isVeryStale
            ? 'A Fresh Fitting Is Recommended'
            : 'Has Anything Changed?'}
        </h2>
        <p className="mt-2 text-sm text-gray-700 leading-relaxed">{policy.message}</p>
        {profileAgeLabel && (
          <p className="mt-2 text-xs text-gray-500">{profileAgeLabel}</p>
        )}
      </div>

      {/* Common body-change prompts */}
      {policy.outcome === 'refit_recommended' && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold text-gray-800 mb-2">
            Body changes that affect fit:
          </p>
          <ul className="space-y-1 text-xs text-gray-600 list-disc list-inside">
            <li>Weight gain or loss (3+ kg)</li>
            <li>Changes in posture or activity level</li>
            <li>Pregnancy or post-pregnancy</li>
            <li>Changes in preferred fit (slimmer / more relaxed)</li>
          </ul>
        </div>
      )}

      {/* CTAs */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleUseSaved}
          disabled={isLoading}
          className={[
            'w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors',
            'border-gray-300 bg-white text-gray-800 hover:border-gray-500 hover:bg-gray-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#826300]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          <span className="block font-semibold">My measurements haven&apos;t changed</span>
          <span className="block text-xs text-gray-500 mt-0.5">
            Continue with my saved fit profile
          </span>
        </button>

        <button
          type="button"
          onClick={handleBookNew}
          disabled={isLoading}
          className={[
            'w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors',
            'bg-gray-900 text-white hover:bg-black',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#826300]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          <span className="block">I&apos;d like a new fitting</span>
          <span className="block text-xs font-normal text-gray-300 mt-0.5">
            Book an appointment to update my measurements
          </span>
        </button>
      </div>
    </div>
  );
}
