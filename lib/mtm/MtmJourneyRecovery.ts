/**
 * A18 MtmJourneyRecovery
 *
 * Persist and restore MTM journey state from localStorage so customers can
 * resume an interrupted journey (page refresh, auth flow, cart redirect)
 * without losing their design, fabric choice, or fit confirmation.
 */

import type { MtmJourneyState, MtmJourneyStep } from './MtmJourneyState';
import { createMtmJourneyState, stepIndex } from './MtmJourneyState';
import type { MtmCategory } from '@/types/mtm';

// ---------------------------------------------------------------------------
// Storage constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'gjm.mtm_journey.v1';
/** After 48 h of inactivity, discard the persisted journey */
const MAX_AGE_MS = 1000 * 60 * 60 * 48;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

interface PersistedJourney {
  savedAt: string;
  state: MtmJourneyState;
}

// ---------------------------------------------------------------------------
// Persistence API
// ---------------------------------------------------------------------------

export function saveJourney(state: MtmJourneyState): void {
  if (!canUseStorage()) return;
  const record: PersistedJourney = {
    savedAt: new Date().toISOString(),
    state,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function loadJourney(): MtmJourneyState | null {
  if (!canUseStorage()) return null;

  const record = safeJsonParse<PersistedJourney>(
    window.localStorage.getItem(STORAGE_KEY),
  );
  if (!record?.state) return null;

  // Discard stale journeys
  const savedAt = new Date(record.savedAt).getTime();
  if (Number.isNaN(savedAt) || Date.now() - savedAt > MAX_AGE_MS) {
    clearJourney();
    return null;
  }

  // Validate minimum shape
  if (!record.state.version || !record.state.journeyId) {
    clearJourney();
    return null;
  }

  return record.state;
}

export function clearJourney(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// ---------------------------------------------------------------------------
// Recovery logic
// ---------------------------------------------------------------------------

export type RecoveryOutcome =
  | { kind: 'resumed'; state: MtmJourneyState; resumeStep: MtmJourneyStep }
  | { kind: 'new'; state: MtmJourneyState };

/**
 * Attempt to restore a persisted journey for the given category.
 * Returns a `resumed` outcome if a valid, relevant journey was found,
 * otherwise starts a fresh journey.
 *
 * The `resumeStep` in a resumed outcome is the last completed step so the
 * caller can decide where to route the customer.
 */
export function recoverJourney(
  category: MtmCategory,
  opts?: { productHandle?: string; variantId?: string },
): RecoveryOutcome {
  const existing = loadJourney();

  if (existing && existing.category === category) {
    return { kind: 'resumed', state: existing, resumeStep: existing.currentStep };
  }

  const fresh = createMtmJourneyState(category, opts);
  saveJourney(fresh);
  return { kind: 'new', state: fresh };
}

/**
 * Determine the most appropriate route to send a customer to based on their
 * current journey step. Used by page/component guards.
 */
export function resolveResumeRoute(
  state: MtmJourneyState,
  routes: Partial<Record<MtmJourneyStep, string>>,
): string | null {
  // Walk backwards from current step to find the last step with a known route
  const orderedSteps: MtmJourneyStep[] = [
    'checkout_started',
    'cart_added',
    'booking_confirmed',
    'fit_confirmed',
    'fit_gate_evaluated',
    'fabric_selected',
    'design_configured',
    'product_selected',
  ];

  for (const step of orderedSteps) {
    if (
      stepIndex(state.currentStep) >= stepIndex(step) &&
      routes[step]
    ) {
      return routes[step]!;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

import { useState, useCallback, useEffect } from 'react';

export interface UseMtmJourneyResult {
  state: MtmJourneyState | null;
  isLoading: boolean;
  update: (next: MtmJourneyState) => void;
  clear: () => void;
  /** Start or resume for the given category */
  initJourney: (
    category: MtmCategory,
    opts?: { productHandle?: string; variantId?: string },
  ) => RecoveryOutcome;
}

/**
 * Client-side hook for managing MTM journey state with localStorage persistence.
 */
export function useMtmJourney(): UseMtmJourneyResult {
  const [state, setState] = useState<MtmJourneyState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hydrate from storage on mount
    const persisted = loadJourney();
    setState(persisted);
    setIsLoading(false);
  }, []);

  const update = useCallback((next: MtmJourneyState) => {
    setState(next);
    saveJourney(next);
  }, []);

  const clear = useCallback(() => {
    setState(null);
    clearJourney();
  }, []);

  const initJourney = useCallback(
    (
      category: MtmCategory,
      opts?: { productHandle?: string; variantId?: string },
    ): RecoveryOutcome => {
      const outcome = recoverJourney(category, opts);
      setState(outcome.state);
      return outcome;
    },
    [],
  );

  return { state, isLoading, update, clear, initJourney };
}
