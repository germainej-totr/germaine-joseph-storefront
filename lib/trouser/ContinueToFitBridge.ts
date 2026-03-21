import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { type MtmOptionSet, trouserOptionSet } from '@/types/trouserOptions';
import {
  mapTrouserDesignPayload,
  type TrouserDesignPayload,
} from '@/lib/trouser/TrouserDesignPayloadMapper';
import {
  saveDraftTrouserDesign,
  saveTrouserDesignHandoff,
} from '@/lib/trouser/TrouserDesignPersistence';

export type TrouserSelections = Record<string, string | undefined>;

export interface ContinueToFitBridgeInput {
  selections: TrouserSelections;
  optionSet?: MtmOptionSet;
  continueTo?: string;
}

export interface ContinueToFitBridgeResult {
  ok: boolean;
  payload: TrouserDesignPayload;
  error?: string;
}

export function continueToFitBridge(
  router: AppRouterInstance,
  input: ContinueToFitBridgeInput,
): ContinueToFitBridgeResult {
  const optionSet = input.optionSet ?? trouserOptionSet;
  const continueTo = input.continueTo ?? '/configure-fit';

  const payload = mapTrouserDesignPayload(input.selections, optionSet);

  if (!payload.validation.isValid) {
    return {
      ok: false,
      payload,
      error: 'invalid_trouser_design_state',
    };
  }

  // Persist both resumable draft and immediate handoff snapshot.
  saveDraftTrouserDesign(payload);
  saveTrouserDesignHandoff(payload);

  const params = new URLSearchParams();
  params.set('optionSet', payload.optionSet);
  params.set('optionSetVersion', payload.optionSetVersion);
  params.set('designUpcharge', String(payload.pricing.totalDesignUpcharge));
  params.set('trouserSelections', JSON.stringify(payload.selections));

  router.push(`${continueTo}?${params.toString()}`);

  return {
    ok: true,
    payload,
  };
}
