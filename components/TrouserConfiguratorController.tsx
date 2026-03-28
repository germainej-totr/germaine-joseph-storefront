'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TrouserDesignConfigurator, {
  type TrouserSelections,
} from '@/components/TrouserDesignConfigurator';
import TrouserDesignSummary from '@/components/TrouserDesignSummary';
import FabricSelector from '@/components/FabricSelector';
import {
  trouserOptionSet,
  type MtmOptionSet,
} from '@/types/trouserOptions';
import type { Fabric } from '@/types/fabric';
import { applyStyleDefaults } from '@/lib/trouser/TrouserOptionDefaults';
import {
  getVisibleOptions,
  removeHiddenSelections,
} from '@/lib/trouser/TrouserOptionVisibility';
import { normalizeTrouserSelections } from '@/lib/trouser/TrouserSelectionNormalizer';
import { validateTrouserSelections } from '@/lib/trouser/TrouserOptionValidation';
import { calculateTrouserPrice } from '@/lib/trouser/TrouserPriceCalculator';
import { mapTrouserDesignPayload } from '@/lib/trouser/TrouserDesignPayloadMapper';
import {
  clearDraftTrouserDesign,
  loadDraftTrouserDesign,
  mapToCartAttributes,
  saveDraftTrouserDesign,
} from '@/lib/trouser/TrouserDesignPersistence';
import { continueToFitBridge } from '@/lib/trouser/ContinueToFitBridge';

export interface TrouserConfiguratorControllerProps {
  optionSet?: MtmOptionSet;
  initialSelections?: TrouserSelections;
  basePrice?: number;
  title?: string;
  continueTo?: string;
  /** Fabric catalogue for A16 fabric selector — omit to hide the fabric step */
  fabrics?: Fabric[];
}

export default function TrouserConfiguratorController({
  optionSet = trouserOptionSet,
  initialSelections = { style: 'dress_pants' },
  basePrice = 399,
  title = 'Trouser Design',
  continueTo = '/configure-fit',
  fabrics,
}: TrouserConfiguratorControllerProps) {
  const router = useRouter();

  const seededInitial = useMemo(
    () => applyStyleDefaults(removeHiddenSelections(initialSelections, optionSet), optionSet),
    [initialSelections, optionSet],
  );

  const [selections, setSelections] = useState<TrouserSelections>(() => {
    const draft = loadDraftTrouserDesign();
    if (!draft?.payload?.selections) return seededInitial;

    const normalized = normalizeTrouserSelections(draft.payload.selections, optionSet);
    return normalized.selections;
  });

  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(() => {
    if (!fabrics) return null;
    const draft = loadDraftTrouserDesign();
    const savedId = draft?.payload?.fabricId;
    return fabrics.find((f) => f.id === savedId) ?? null;
  });

  const visibleOptions = useMemo(
    () => getVisibleOptions(selections, optionSet),
    [selections, optionSet],
  );

  const pricing = useMemo(
    () => calculateTrouserPrice(selections, optionSet),
    [selections, optionSet],
  );

  const validation = useMemo(
    () => validateTrouserSelections(selections, optionSet),
    [selections, optionSet],
  );

  function handleConfiguratorChange(next: TrouserSelections): void {
    // Keep state consistently clean after each user interaction.
    const normalized = normalizeTrouserSelections(next, optionSet);
    setSelections(normalized.selections);

    // Autosave resumable draft as user configures.
    const payload = mapTrouserDesignPayload(normalized.selections, optionSet, selectedFabric);
    saveDraftTrouserDesign(payload);
  }

  function handleFabricSelect(fabric: Fabric | null): void {
    setSelectedFabric(fabric);
    const payload = mapTrouserDesignPayload(selections, optionSet, fabric);
    saveDraftTrouserDesign(payload);
  }

  function handleSave(current: TrouserSelections): void {
    const payload = mapTrouserDesignPayload(current, optionSet, selectedFabric);
    saveDraftTrouserDesign(payload);

    const cartAttributes = mapToCartAttributes(payload);
    console.log('Trouser design payload:', payload);
    console.log('Cart attributes snapshot:', cartAttributes);
    alert('Design saved. Draft persisted for resume.');
  }

  function handleContinue(current: TrouserSelections): void {
    const bridge = continueToFitBridge(router, {
      selections: current,
      optionSet,
      continueTo,
    });

    if (!bridge.ok) {
      alert('Please complete all required selections before continuing.');
      return;
    }

    // Optional lifecycle behavior: clear draft once user continues to fit.
    clearDraftTrouserDesign();
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="flex-1 min-w-0">
          <TrouserDesignConfigurator
            value={selections}
            onChange={(next) => handleConfiguratorChange(next)}
            optionSet={optionSet}
            basePrice={basePrice}
            title={title}
          />

          {/* A16 Fabric Selector — rendered below design options when fabrics are provided */}
          {fabrics && fabrics.length > 0 && (
            <section className="mt-10">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3 select-none">
                Fabric
              </h3>
              <FabricSelector
                fabrics={fabrics}
                selectedId={selectedFabric?.id}
                onSelect={handleFabricSelect}
                category="trouser"
              />
            </section>
          )}
        </div>

        <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-8">
          <TrouserDesignSummary
            value={selections}
            visibleOptions={visibleOptions}
            basePrice={basePrice}
            priceDelta={pricing.total}
            onSave={handleSave}
            onContinueToFit={handleContinue}
          />

          {/* Fabric summary chip */}
          {selectedFabric && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Selected Fabric</p>
              <p className="text-xs text-gray-800 mt-0.5">{selectedFabric.mill} — {selectedFabric.name}</p>
            </div>
          )}

          {!validation.isValid && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs font-semibold text-amber-700">Validation warnings</p>
              {validation.invalidCombinationRules.length > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Invalid combinations: {validation.invalidCombinationRules.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
