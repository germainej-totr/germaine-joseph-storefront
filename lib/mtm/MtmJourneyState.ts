import type { MtmCategory } from '@/types/mtm';
import type { SavedFitPolicyResult } from '@/lib/fit/SavedFitPolicy';
import type { ConfirmationDecision } from '@/components/BodyChangeConfirmation';

// ---------------------------------------------------------------------------
// Journey step enum
// ---------------------------------------------------------------------------

/**
 * Ordered steps in the MTM customer journey.
 * Each step represents a discrete stage that can be reached, completed, or
 * abandoned without losing prior progress.
 */
export type MtmJourneyStep =
  | 'product_selected'   // Customer chose a product/category
  | 'design_configured'  // Option selections made
  | 'fabric_selected'    // Fabric chosen from catalogue (A16)
  | 'fit_gate_evaluated' // Saved-fit policy evaluated (A17)
  | 'fit_confirmed'      // Customer confirmed saved fit or booked new fitting
  | 'booking_confirmed'  // Appointment confirmed (if new fit required)
  | 'cart_added'         // Item added to Shopify cart with MTM attributes
  | 'checkout_started';  // Redirected to Shopify checkout

// ---------------------------------------------------------------------------
// Journey state
// ---------------------------------------------------------------------------

export interface MtmJourneyState {
  /** Schema version — increment on breaking changes */
  version: 'v1';
  /** Unique session-scoped id so we can correlate across storage */
  journeyId: string;
  /** ISO timestamp when journey was first initialised */
  startedAt: string;
  /** ISO timestamp of last mutation */
  updatedAt: string;
  /** Furthest step reached (does not go backwards) */
  currentStep: MtmJourneyStep;

  // --- Product context ---
  category: MtmCategory | null;
  productHandle: string | null;
  variantId: string | null;

  // --- Design snapshot ---
  design: {
    optionSet: string;
    optionSetVersion: string;
    selections: Record<string, string>;
    pricingTotal: number;
    fabricId?: string;
    fabricName?: string;
  } | null;

  // --- Fit policy decision ---
  fitPolicy: {
    evaluatedAt: string;
    profileId: string | null;
    policyResult: SavedFitPolicyResult;
  } | null;

  // --- Customer confirmation (A17) ---
  fitConfirmation: ConfirmationDecision | null;

  // --- Booking (when new fit required) ---
  bookingId: string | null;

  // --- Cart / checkout ---
  cartLineId: string | null;
  checkoutUrl: string | null;
}

// ---------------------------------------------------------------------------
// Step ordering (used by guards)
// ---------------------------------------------------------------------------

const STEP_ORDER: MtmJourneyStep[] = [
  'product_selected',
  'design_configured',
  'fabric_selected',
  'fit_gate_evaluated',
  'fit_confirmed',
  'booking_confirmed',
  'cart_added',
  'checkout_started',
];

export function stepIndex(step: MtmJourneyStep): number {
  return STEP_ORDER.indexOf(step);
}

export function isStepReached(
  state: MtmJourneyState,
  required: MtmJourneyStep,
): boolean {
  return stepIndex(state.currentStep) >= stepIndex(required);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMtmJourneyState(
  category: MtmCategory,
  opts?: Partial<Pick<MtmJourneyState, 'productHandle' | 'variantId'>>,
): MtmJourneyState {
  const now = new Date().toISOString();
  return {
    version: 'v1',
    journeyId: `journey_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    startedAt: now,
    updatedAt: now,
    currentStep: 'product_selected',
    category,
    productHandle: opts?.productHandle ?? null,
    variantId: opts?.variantId ?? null,
    design: null,
    fitPolicy: null,
    fitConfirmation: null,
    bookingId: null,
    cartLineId: null,
    checkoutUrl: null,
  };
}

// ---------------------------------------------------------------------------
// Immutable step transitions
// ---------------------------------------------------------------------------

type JourneyMutation<T extends Partial<MtmJourneyState>> = (state: MtmJourneyState) => MtmJourneyState & T;

function advance(
  state: MtmJourneyState,
  nextStep: MtmJourneyStep,
  patch: Partial<MtmJourneyState>,
): MtmJourneyState {
  const currentIdx = stepIndex(state.currentStep);
  const nextIdx = stepIndex(nextStep);
  // Allow re-confirming the same step (e.g. customer re-picks fabric)
  const resolvedStep =
    nextIdx > currentIdx ? nextStep : state.currentStep;

  return {
    ...state,
    ...patch,
    currentStep: resolvedStep,
    updatedAt: new Date().toISOString(),
  };
}

export function applyDesignConfigured(
  state: MtmJourneyState,
  design: MtmJourneyState['design'],
): MtmJourneyState {
  return advance(state, 'design_configured', { design });
}

export function applyFabricSelected(
  state: MtmJourneyState,
  fabricId: string,
  fabricName: string,
): MtmJourneyState {
  const updatedDesign = state.design
    ? { ...state.design, fabricId, fabricName }
    : null;
  return advance(state, 'fabric_selected', { design: updatedDesign });
}

export function applyFitGateEvaluated(
  state: MtmJourneyState,
  profileId: string | null,
  policyResult: SavedFitPolicyResult,
): MtmJourneyState {
  return advance(state, 'fit_gate_evaluated', {
    fitPolicy: {
      evaluatedAt: new Date().toISOString(),
      profileId,
      policyResult,
    },
  });
}

export function applyFitConfirmed(
  state: MtmJourneyState,
  decision: ConfirmationDecision,
): MtmJourneyState {
  return advance(state, 'fit_confirmed', { fitConfirmation: decision });
}

export function applyBookingConfirmed(
  state: MtmJourneyState,
  bookingId: string,
): MtmJourneyState {
  return advance(state, 'booking_confirmed', { bookingId });
}

export function applyCartAdded(
  state: MtmJourneyState,
  cartLineId: string,
): MtmJourneyState {
  return advance(state, 'cart_added', { cartLineId });
}

export function applyCheckoutStarted(
  state: MtmJourneyState,
  checkoutUrl: string,
): MtmJourneyState {
  return advance(state, 'checkout_started', { checkoutUrl });
}
