/**
 * A18 MtmJourneyGuard
 *
 * Route-transition guards that enforce valid state progression through
 * the MTM journey. Guards are pure functions — no side effects — so they
 * can be used in both Server Components and client-side navigation logic.
 */

import type { MtmJourneyState, MtmJourneyStep } from './MtmJourneyState';
import { isStepReached } from './MtmJourneyState';

// ---------------------------------------------------------------------------
// Guard result
// ---------------------------------------------------------------------------

export interface GuardResult {
  allowed: boolean;
  /** If not allowed, redirect the customer here */
  redirectTo?: string;
  /** Human-readable reason (for logging / debugging) */
  reason?: string;
}

// ---------------------------------------------------------------------------
// Individual guards
// ---------------------------------------------------------------------------

/**
 * Design step guard — category must be selected.
 */
export function guardDesignStep(
  state: MtmJourneyState | null,
  redirectTo = '/',
): GuardResult {
  if (!state || !state.category) {
    return { allowed: false, redirectTo, reason: 'no_category_selected' };
  }
  return { allowed: true };
}

/**
 * Fabric step guard — design must be configured.
 */
export function guardFabricStep(
  state: MtmJourneyState | null,
  redirectTo = '/product',
): GuardResult {
  if (!state || !isStepReached(state, 'design_configured') || !state.design) {
    return {
      allowed: false,
      redirectTo,
      reason: 'design_not_configured',
    };
  }
  return { allowed: true };
}

/**
 * Fit gate guard — design must be configured (fabric is optional).
 */
export function guardFitGateStep(
  state: MtmJourneyState | null,
  redirectTo = '/product',
): GuardResult {
  if (!state || !isStepReached(state, 'design_configured') || !state.design) {
    return {
      allowed: false,
      redirectTo,
      reason: 'design_not_configured',
    };
  }
  return { allowed: true };
}

/**
 * Fit confirmation guard — fit gate must have been evaluated and
 * result must require confirmation (refit_recommended).
 */
export function guardFitConfirmationStep(
  state: MtmJourneyState | null,
  redirectTo = '/configure-fit',
): GuardResult {
  if (!state || !isStepReached(state, 'fit_gate_evaluated')) {
    return {
      allowed: false,
      redirectTo,
      reason: 'fit_gate_not_evaluated',
    };
  }

  const outcome = state.fitPolicy?.policyResult?.outcome;
  if (outcome === 'saved_fit_allowed') {
    // No confirmation needed — skip this step
    return { allowed: false, redirectTo, reason: 'confirmation_not_required' };
  }

  if (outcome === 'refit_required') {
    // Hard block — send to booking, not confirmation
    return {
      allowed: false,
      redirectTo: '/fit/book',
      reason: 'refit_required_no_choice',
    };
  }

  return { allowed: true };
}

/**
 * Cart addition guard — fit must be confirmed or auto-approved.
 */
export function guardCartStep(
  state: MtmJourneyState | null,
  redirectTo = '/configure-fit',
): GuardResult {
  if (!state || !isStepReached(state, 'fit_gate_evaluated')) {
    return {
      allowed: false,
      redirectTo,
      reason: 'fit_gate_not_evaluated',
    };
  }

  const outcome = state.fitPolicy?.policyResult?.outcome;

  // Saved fit allowed — no confirmation needed, can proceed
  if (outcome === 'saved_fit_allowed') return { allowed: true };

  // Refit required — must have a booking
  if (outcome === 'refit_required') {
    if (!state.bookingId) {
      return {
        allowed: false,
        redirectTo: '/fit/book',
        reason: 'booking_required_before_cart',
      };
    }
    return { allowed: true };
  }

  // Refit recommended — must have customer confirmation
  if (outcome === 'refit_recommended' && !state.fitConfirmation) {
    return {
      allowed: false,
      redirectTo,
      reason: 'fit_confirmation_required',
    };
  }

  return { allowed: true };
}

/**
 * Checkout guard — cart line must be attached.
 */
export function guardCheckoutStep(
  state: MtmJourneyState | null,
  redirectTo = '/cart',
): GuardResult {
  if (!state || !isStepReached(state, 'cart_added') || !state.cartLineId) {
    return { allowed: false, redirectTo, reason: 'cart_not_populated' };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Convenience: evaluate a specific required step
// ---------------------------------------------------------------------------

/**
 * Generic guard: check that the journey has reached the required step.
 * Use for simple step-reachability checks where no deeper logic is needed.
 */
export function guardRequiresStep(
  state: MtmJourneyState | null,
  requiredStep: MtmJourneyStep,
  redirectTo: string,
): GuardResult {
  if (!state || !isStepReached(state, requiredStep)) {
    return {
      allowed: false,
      redirectTo,
      reason: `step_not_reached:${requiredStep}`,
    };
  }
  return { allowed: true };
}
