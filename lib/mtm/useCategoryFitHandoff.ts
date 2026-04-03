'use client';

import { useMemo } from 'react';
import {
  resolveCategoryFitHandoff,
  type CategoryFitSnapshot,
  type CategoryFitHandoffSource,
} from '@/lib/mtm/CategoryFitHandoffStorage';

type SearchParamsLike = {
  get(name: string): string | null;
  has(name: string): boolean;
  toString(): string;
};

export interface UseCategoryFitHandoffResult {
  snapshot: CategoryFitSnapshot | null;
  source: CategoryFitHandoffSource;
  isCategoryFlow: boolean;
}

export function useCategoryFitHandoff(searchParams: SearchParamsLike): UseCategoryFitHandoffResult {
  return useMemo(() => {
    const resolved = resolveCategoryFitHandoff(searchParams);
    return {
      snapshot: resolved.snapshot,
      source: resolved.source,
      isCategoryFlow: resolved.isCategoryFlow,
    };
  }, [searchParams]);
}
