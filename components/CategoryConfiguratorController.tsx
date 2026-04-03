'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import GenericMtmConfigurator, { type GenericMtmSelections } from '@/components/GenericMtmConfigurator';
import FabricSelector from '@/components/FabricSelector';
import type { Fabric } from '@/types/fabric';
import type { MtmOptionSet } from '@/types/trouserOptions';
import { saveCategoryDesignHandoff } from '@/lib/mtm/CategoryFitHandoffStorage';

interface DraftCategoryDesign {
  selections: GenericMtmSelections;
  fabricId?: string;
}

export interface CategoryConfiguratorControllerProps {
  optionSet: MtmOptionSet;
  title: string;
  intro?: string;
  basePrice?: number;
  continueTo?: string;
  draftStorageKey: string;
  fabrics?: Fabric[];
}

function getVisibleOptions(optionSet: MtmOptionSet, selections: GenericMtmSelections) {
  return optionSet.options.filter((option) => {
    if (!option.dependsOn) return true;

    return Object.entries(option.dependsOn).every(([depKey, depValue]) => {
      const actual = selections[depKey];
      if (Array.isArray(depValue)) return actual !== undefined && depValue.includes(actual);
      return actual === depValue;
    });
  });
}

function seedDefaults(optionSet: MtmOptionSet): GenericMtmSelections {
  const defaults: GenericMtmSelections = {};
  for (const option of optionSet.options) {
    if (!option.required) continue;
    const firstChoice = option.choices?.[0]?.value;
    if (firstChoice) defaults[option.key] = firstChoice;
  }
  return defaults;
}

function validateSelections(optionSet: MtmOptionSet, selections: GenericMtmSelections): boolean {
  const visible = getVisibleOptions(optionSet, selections);
  return visible.every((option) => !option.required || !!selections[option.key]);
}

export default function CategoryConfiguratorController({
  optionSet,
  title,
  intro,
  basePrice = 499,
  continueTo = '/configure-fit',
  draftStorageKey,
  fabrics,
}: CategoryConfiguratorControllerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [designUpcharge, setDesignUpcharge] = useState(0);

  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(() => {
    if (!fabrics?.length || typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(draftStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DraftCategoryDesign;
      return fabrics.find((fabric) => fabric.id === parsed.fabricId) ?? null;
    } catch {
      return null;
    }
  });

  const [selections, setSelections] = useState<GenericMtmSelections>(() => {
    const defaults = seedDefaults(optionSet);
    if (typeof window === 'undefined') return defaults;

    try {
      const raw = localStorage.getItem(draftStorageKey);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as DraftCategoryDesign;
      return { ...defaults, ...parsed.selections };
    } catch {
      return defaults;
    }
  });

  const isValid = useMemo(() => validateSelections(optionSet, selections), [optionSet, selections]);

  const persistDraft = useCallback(
    (nextSelections: GenericMtmSelections, nextFabric?: Fabric | null) => {
      if (typeof window === 'undefined') return;
      const payload: DraftCategoryDesign = {
        selections: nextSelections,
        fabricId: nextFabric?.id,
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(payload));
    },
    [draftStorageKey],
  );

  const handleChange = useCallback(
    (next: GenericMtmSelections, nextUpcharge: number) => {
      setSelections(next);
      setDesignUpcharge(nextUpcharge);
      persistDraft(next, selectedFabric);
    },
    [persistDraft, selectedFabric],
  );

  const handleComplete = useCallback(() => {
    const cleanedSelections = Object.fromEntries(
      Object.entries(selections).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && !!entry[1]),
    );

    const handoff = {
      category: optionSet.category,
      optionSet: optionSet.id,
      optionSetVersion: optionSet.version,
      selections: cleanedSelections,
      pricing: {
        total: designUpcharge,
        breakdown: [],
      },
      fabricId: selectedFabric?.id,
      createdAt: new Date().toISOString(),
    };

    saveCategoryDesignHandoff(handoff);
    persistDraft(selections, selectedFabric);

    const params = new URLSearchParams(searchParams.toString());
    params.set('category', optionSet.category);
    params.set('optionSet', optionSet.id);
    params.set('optionSetVersion', optionSet.version);
    params.set('mtmSelections', JSON.stringify(cleanedSelections));
    params.set('designUpcharge', String(designUpcharge));
    if (selectedFabric?.id) {
      params.set('fabricId', selectedFabric.id);
    }

    router.push(`${continueTo}?${params.toString()}`);
  }, [
    continueTo,
    designUpcharge,
    optionSet.category,
    optionSet.id,
    optionSet.version,
    persistDraft,
    router,
    searchParams,
    selections,
    selectedFabric,
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-serif uppercase tracking-wider text-gray-900">{title}</h1>
        {intro ? <p className="mt-2 text-sm text-gray-600">{intro}</p> : null}
      </div>

      {fabrics?.length ? (
        <div className="mb-10">
          <FabricSelector
            fabrics={fabrics}
            selectedId={selectedFabric?.id}
            category={optionSet.category}
            onSelect={(fabric) => {
              setSelectedFabric(fabric);
              persistDraft(selections, fabric);
            }}
          />
        </div>
      ) : null}

      <GenericMtmConfigurator
        optionSet={optionSet}
        value={selections}
        onChange={handleChange}
        basePrice={basePrice}
        title={optionSet.title}
        ctaLabel="Continue to Fit Profile"
        onComplete={handleComplete}
      />

      {!isValid ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Please complete all required options before continuing.
        </div>
      ) : null}
    </div>
  );
}
