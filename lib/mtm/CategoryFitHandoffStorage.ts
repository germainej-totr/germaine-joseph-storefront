import type { MtmCategory } from '@/types/mtm';

const CATEGORY_HANDOFF_STORAGE_KEY = 'gjm.category_design.handoff.v1';
const SESSION_HANDOFF_MAX_AGE_MS = 1000 * 60 * 60 * 6;

type SearchParamsLike = {
  get(name: string): string | null;
  has(name: string): boolean;
};

export type CategoryFitHandoffSource = 'query' | 'session' | 'none';

export type CategoryFitSnapshot = {
  category: MtmCategory;
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
  fabricId?: string;
  createdAt: string;
};

export interface CategoryFitHandoffResolution {
  snapshot: CategoryFitSnapshot | null;
  source: CategoryFitHandoffSource;
  isCategoryFlow: boolean;
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeSelections(input: unknown): Record<string, string> | null {
  if (!isRecord(input)) return null;

  const selections: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && value.trim()) {
      selections[key] = value;
    }
  }

  return Object.keys(selections).length ? selections : null;
}

function sanitizeSnapshot(input: unknown): CategoryFitSnapshot | null {
  if (!isRecord(input)) return null;

  const category = input.category;
  if (
    category !== 'suit' &&
    category !== 'shirt' &&
    category !== 'trouser' &&
    category !== 'overcoat' &&
    category !== 'blazer' &&
    category !== 'vest' &&
    category !== 'jacket'
  ) {
    return null;
  }

  if (typeof input.optionSet !== 'string' || !input.optionSet) return null;
  if (typeof input.optionSetVersion !== 'string' || !input.optionSetVersion) return null;
  if (typeof input.createdAt !== 'string' || Number.isNaN(new Date(input.createdAt).getTime())) return null;

  const selections = sanitizeSelections(input.selections);
  if (!selections) return null;

  const pricingRaw = isRecord(input.pricing) ? input.pricing : {};
  const total = typeof pricingRaw.total === 'number' && Number.isFinite(pricingRaw.total) ? pricingRaw.total : 0;

  const breakdown = Array.isArray(pricingRaw.breakdown)
    ? pricingRaw.breakdown
        .filter((item) => isRecord(item))
        .map((item) => ({
          key: typeof item.key === 'string' ? item.key : 'custom',
          label: typeof item.label === 'string' ? item.label : 'Custom option',
          amount: typeof item.amount === 'number' ? item.amount : 0,
        }))
    : [];

  return {
    category,
    optionSet: input.optionSet,
    optionSetVersion: input.optionSetVersion,
    selections,
    pricing: { total, breakdown },
    fabricId: typeof input.fabricId === 'string' ? input.fabricId : undefined,
    createdAt: input.createdAt,
  };
}

function isExpired(createdAt: string, maxAgeMs: number): boolean {
  const createdAtMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtMs)) return true;
  return Date.now() - createdAtMs > maxAgeMs;
}

export function saveCategoryDesignHandoff(snapshot: CategoryFitSnapshot): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  window.sessionStorage.setItem(CATEGORY_HANDOFF_STORAGE_KEY, JSON.stringify(snapshot));
}

export function loadCategoryDesignHandoff(maxAgeMs: number = SESSION_HANDOFF_MAX_AGE_MS): CategoryFitSnapshot | null {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  const raw = window.sessionStorage.getItem(CATEGORY_HANDOFF_STORAGE_KEY);
  if (!raw) return null;

  const parsed = safeParse(raw);
  const snapshot = sanitizeSnapshot(parsed);
  if (!snapshot) return null;

  if (isExpired(snapshot.createdAt, maxAgeMs)) {
    window.sessionStorage.removeItem(CATEGORY_HANDOFF_STORAGE_KEY);
    return null;
  }

  return snapshot;
}

export function parseCategoryHandoffFromQuery(searchParams: SearchParamsLike): CategoryFitSnapshot | null {
  const category = searchParams.get('category') as MtmCategory | null;
  const optionSet = searchParams.get('optionSet');
  const optionSetVersion = searchParams.get('optionSetVersion');
  const rawSelections = searchParams.get('mtmSelections');

  if (!category || !optionSet || !optionSetVersion || !rawSelections) return null;

  const parsedSelections = safeParse(rawSelections);
  const selections = sanitizeSelections(parsedSelections);
  if (!selections) return null;

  const upchargeRaw = Number(searchParams.get('designUpcharge') ?? '0');

  return {
    category,
    optionSet,
    optionSetVersion,
    selections,
    pricing: {
      total: Number.isFinite(upchargeRaw) ? upchargeRaw : 0,
      breakdown: [],
    },
    fabricId: searchParams.get('fabricId') || undefined,
    createdAt: new Date().toISOString(),
  };
}

export function resolveCategoryFitHandoff(searchParams: SearchParamsLike): CategoryFitHandoffResolution {
  const isCategoryFlow =
    searchParams.has('mtmSelections') ||
    searchParams.has('category') ||
    searchParams.has('optionSet');

  const querySnapshot = parseCategoryHandoffFromQuery(searchParams);
  if (querySnapshot) {
    return { snapshot: querySnapshot, source: 'query', isCategoryFlow };
  }

  const sessionSnapshot = loadCategoryDesignHandoff();
  if (sessionSnapshot) {
    return { snapshot: sessionSnapshot, source: 'session', isCategoryFlow };
  }

  return { snapshot: null, source: 'none', isCategoryFlow };
}
