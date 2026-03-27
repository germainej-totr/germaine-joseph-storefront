'use client';

import { useMemo } from 'react';
import {
  resolveFitHandoff,
  type ContinueToFitSnapshot,
  type FitHandoffSource,
} from '@/lib/trouser/FitHandoffStorage';

type SearchParamsLike = {
  get(name: string): string | null;
  has(name: string): boolean;
  toString(): string;
};

export interface UseFitHandoffResult {
  snapshot: ContinueToFitSnapshot | null;
  source: FitHandoffSource;
  isTrouserFlow: boolean;
  requiresTrouserRedirect: boolean;
}

export function useFitHandoff(searchParams: SearchParamsLike): UseFitHandoffResult {
  return useMemo(() => {
    const resolved = resolveFitHandoff(searchParams);

    return {
      snapshot: resolved.snapshot,
      source: resolved.source,
      isTrouserFlow: resolved.isTrouserFlow,
      requiresTrouserRedirect: resolved.isTrouserFlow && !resolved.snapshot,
    };
  }, [searchParams]);
}
