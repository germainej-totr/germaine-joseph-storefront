import type { TrouserDesignPayload } from '@/lib/trouser/TrouserDesignPayloadMapper';

const TROUSER_DRAFT_STORAGE_KEY = 'gjm.trouser_design.draft.v1';
const TROUSER_HANDOFF_STORAGE_KEY = 'gjm.trouser_design.handoff.v1';

interface StoredDraft {
  savedAt: string;
  payload: TrouserDesignPayload;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

export function saveDraftTrouserDesign(payload: TrouserDesignPayload): void {
  if (!canUseStorage()) return;

  const draft: StoredDraft = {
    savedAt: new Date().toISOString(),
    payload,
  };

  window.localStorage.setItem(TROUSER_DRAFT_STORAGE_KEY, safeStringify(draft));
}

export function loadDraftTrouserDesign(): StoredDraft | null {
  if (!canUseStorage()) return null;

  const raw = window.localStorage.getItem(TROUSER_DRAFT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed?.payload?.selections) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraftTrouserDesign(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(TROUSER_DRAFT_STORAGE_KEY);
}

// Store a short-lived handoff snapshot for Fit step consumption.
export function saveTrouserDesignHandoff(payload: TrouserDesignPayload): void {
  if (!canUseStorage()) return;
  const snapshot: StoredDraft = {
    savedAt: new Date().toISOString(),
    payload,
  };
  window.sessionStorage.setItem(TROUSER_HANDOFF_STORAGE_KEY, safeStringify(snapshot));
}

export function loadTrouserDesignHandoff(): StoredDraft | null {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  const raw = window.sessionStorage.getItem(TROUSER_HANDOFF_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed?.payload?.selections) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearTrouserDesignHandoff(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  window.sessionStorage.removeItem(TROUSER_HANDOFF_STORAGE_KEY);
}

// Line item attribute-friendly flat key/value map using gjm namespace.
export function mapToCartAttributes(payload: TrouserDesignPayload): Record<string, string> {
  return {
    gjm_mtm_category: payload.category,
    gjm_mtm_option_set: payload.optionSet,
    gjm_mtm_option_set_version: payload.optionSetVersion,
    gjm_trouser_selections: safeStringify(payload.selections),
    gjm_trouser_pricing: safeStringify(payload.pricing),
    gjm_trouser_validation: safeStringify(payload.validation),
  };
}
