import {
  clearTrouserDesignHandoff,
  loadDraftTrouserDesign,
} from '@/lib/trouser/TrouserDesignPersistence';
import type { TrouserDesignPayload } from '@/lib/trouser/TrouserDesignPayloadMapper';

const TROUSER_HANDOFF_STORAGE_KEY = 'gjm.trouser_design.handoff.v1';
const SESSION_HANDOFF_MAX_AGE_MS = 1000 * 60 * 60 * 6;
const DRAFT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

type SearchParamsLike = {
  get(name: string): string | null;
  has(name: string): boolean;
};

export type FitHandoffSource = 'query' | 'session' | 'draft' | 'none';

export type ContinueToFitSnapshot = {
  category: 'trouser';
  optionSet: string;
  optionSetVersion: string;
  selections: Record<string, string>;
  pricing: {
    total: number;
    breakdown: Array<{
      key: string;
      label: string;
      amount: number;
    }>;
  };
  validation: {
    isValid: boolean;
    errors: string[];
  };
  createdAt: string;
};

export interface FitHandoffResolution {
  snapshot: ContinueToFitSnapshot | null;
  source: FitHandoffSource;
  isTrouserFlow: boolean;
}

function toErrorList(payload: TrouserDesignPayload): string[] {
  const errors: string[] = [];

  for (const key of payload.validation.missingRequiredKeys) {
    errors.push(`missing_required:${key}`);
  }
  for (const key of payload.validation.invalidValueKeys) {
    errors.push(`invalid_value:${key}`);
  }
  for (const key of payload.validation.invalidCombinationRules) {
    errors.push(`invalid_combination:${key}`);
  }

  return errors;
}

function payloadToSnapshot(payload: TrouserDesignPayload, createdAt: string): ContinueToFitSnapshot {
  return {
    category: payload.category,
    optionSet: payload.optionSet,
    optionSetVersion: payload.optionSetVersion,
    selections: payload.selections,
    pricing: {
      total: payload.pricing.totalDesignUpcharge,
      breakdown: payload.pricing.breakdown.map((item) => ({
        key: item.key,
        label: `${item.optionLabel}: ${item.choiceLabel}`,
        amount: item.amount,
      })),
    },
    validation: {
      isValid: payload.validation.isValid,
      errors: toErrorList(payload),
    },
    createdAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isIsoDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function isExpired(createdAt: string, maxAgeMs: number): boolean {
  const createdAtMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtMs)) return true;

  return Date.now() - createdAtMs > maxAgeMs;
}

function sanitizeSelections(input: unknown): Record<string, string> | null {
  if (!isRecord(input)) return null;

  const selections: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== 'string' || !value.trim()) continue;
    selections[key] = value;
  }

  return Object.keys(selections).length ? selections : null;
}

function sanitizeBreakdown(input: unknown): ContinueToFitSnapshot['pricing']['breakdown'] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item) => isRecord(item))
    .map((item) => ({
      key: typeof item.key === 'string' ? item.key : 'custom',
      label: typeof item.label === 'string' ? item.label : 'Custom option',
      amount: typeof item.amount === 'number' ? item.amount : 0,
    }))
    .filter((item) => Number.isFinite(item.amount));
}

function sanitizeSnapshot(input: unknown): ContinueToFitSnapshot | null {
  if (!isRecord(input)) return null;

  if (input.category !== 'trouser') return null;
  if (typeof input.optionSet !== 'string' || !input.optionSet) return null;
  if (typeof input.optionSetVersion !== 'string' || !input.optionSetVersion) return null;
  if (typeof input.createdAt !== 'string' || !isIsoDate(input.createdAt)) return null;

  const selections = sanitizeSelections(input.selections);
  if (!selections) return null;

  const pricingRaw = isRecord(input.pricing) ? input.pricing : {};
  const validationRaw = isRecord(input.validation) ? input.validation : {};

  const total = typeof pricingRaw.total === 'number' && Number.isFinite(pricingRaw.total) ? pricingRaw.total : 0;
  const breakdown = sanitizeBreakdown(pricingRaw.breakdown);
  const isValid = validationRaw.isValid === true;
  const errors = Array.isArray(validationRaw.errors)
    ? validationRaw.errors.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    category: 'trouser',
    optionSet: input.optionSet,
    optionSetVersion: input.optionSetVersion,
    selections,
    pricing: {
      total,
      breakdown,
    },
    validation: {
      isValid,
      errors,
    },
    createdAt: input.createdAt,
  };
}

function hydrateFromStoredDraft(rawDraft: unknown): ContinueToFitSnapshot | null {
  if (!isRecord(rawDraft)) return null;

  const savedAt = typeof rawDraft.savedAt === 'string' ? rawDraft.savedAt : new Date().toISOString();
  const payload = rawDraft.payload;
  if (!isRecord(payload)) return null;

  const partialPayload = payload as unknown as TrouserDesignPayload;
  if (!partialPayload?.selections || !partialPayload?.optionSet || !partialPayload?.optionSetVersion) {
    return null;
  }

  return payloadToSnapshot(partialPayload, savedAt);
}

export function parseHandoffFromQuery(searchParams: SearchParamsLike): ContinueToFitSnapshot | null {
  const optionSet = searchParams.get('optionSet');
  const optionSetVersion = searchParams.get('optionSetVersion');
  const rawSelections = searchParams.get('trouserSelections');

  if (!optionSet || !optionSetVersion || !rawSelections) return null;

  const parsedSelections = safeParse(rawSelections);
  const selections = sanitizeSelections(parsedSelections);
  if (!selections) return null;

  const designUpchargeRaw = searchParams.get('designUpcharge');
  const parsedUpcharge = Number(designUpchargeRaw ?? '0');
  const total = Number.isFinite(parsedUpcharge) ? parsedUpcharge : 0;

  const snapshot: ContinueToFitSnapshot = {
    category: 'trouser',
    optionSet,
    optionSetVersion,
    selections,
    pricing: {
      total,
      breakdown: [],
    },
    validation: {
      isValid: true,
      errors: [],
    },
    createdAt: new Date().toISOString(),
  };

  return snapshot;
}

export function loadSessionHandoffSnapshot(
  maxAgeMs: number = SESSION_HANDOFF_MAX_AGE_MS,
): ContinueToFitSnapshot | null {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;

  const raw = window.sessionStorage.getItem(TROUSER_HANDOFF_STORAGE_KEY);
  if (!raw) return null;

  const parsed = safeParse(raw);

  let snapshot = sanitizeSnapshot(parsed);
  if (!snapshot) {
    snapshot = hydrateFromStoredDraft(parsed);
  }

  if (!snapshot) {
    clearTrouserDesignHandoff();
    return null;
  }

  if (isExpired(snapshot.createdAt, maxAgeMs)) {
    clearTrouserDesignHandoff();
    return null;
  }

  return snapshot;
}

export function loadDraftHandoffSnapshot(maxAgeMs: number = DRAFT_MAX_AGE_MS): ContinueToFitSnapshot | null {
  const draft = loadDraftTrouserDesign();
  if (!draft) return null;

  const snapshot = payloadToSnapshot(draft.payload, draft.savedAt);
  if (isExpired(snapshot.createdAt, maxAgeMs)) {
    return null;
  }

  return snapshot;
}

export function resolveFitHandoff(searchParams: SearchParamsLike): FitHandoffResolution {
  const isTrouserFlow =
    searchParams.has('trouserSelections') ||
    searchParams.has('optionSet') ||
    searchParams.get('category') === 'trouser';

  const querySnapshot = parseHandoffFromQuery(searchParams);
  if (querySnapshot) {
    return {
      snapshot: querySnapshot,
      source: 'query',
      isTrouserFlow,
    };
  }

  const sessionSnapshot = loadSessionHandoffSnapshot();
  if (sessionSnapshot) {
    return {
      snapshot: sessionSnapshot,
      source: 'session',
      isTrouserFlow,
    };
  }

  const draftSnapshot = loadDraftHandoffSnapshot();
  if (draftSnapshot) {
    return {
      snapshot: draftSnapshot,
      source: 'draft',
      isTrouserFlow,
    };
  }

  return {
    snapshot: null,
    source: 'none',
    isTrouserFlow,
  };
}