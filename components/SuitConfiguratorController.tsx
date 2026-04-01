'use client';

import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import GenericMtmConfigurator from '@/components/GenericMtmConfigurator';
import FabricSelector from '@/components/FabricSelector';
import type { SuitVariant } from '@/types/suitOptions';
import type { Fabric } from '@/types/fabric';
import { applySuitStyleDefaults } from '@/lib/suit/SuitOptionDefaults';
import { getSuitOptionSetByVariant } from '@/lib/suit/SuitOptionVisibility';
import { normalizeSuitSelections } from '@/lib/suit/SuitSelectionNormalizer';
import { validateSuitSelections } from '@/lib/suit/SuitOptionValidation';
import { calculateSuitPrice } from '@/lib/suit/SuitPriceCalculator';
import {
  clearDraftSuitDesign,
  loadDraftSuitDesign,
  saveDraftSuitDesign,
} from '@/lib/suit/SuitDesignPersistence';
import type { SuitSelections } from '@/lib/suit/SuitOptionVisibility';

export interface SuitConfiguratorControllerProps {
  initialVariant?: SuitVariant;
  initialSelections?: SuitSelections;
  basePrice?: number;
  continueTo?: string;
  /** Fabric catalogue for A16 fabric selector — omit to hide the fabric step */
  fabrics?: Fabric[];
  /** Called when user completes configurator; can override default add-to-cart */
  onDesignComplete?: (payload: {
    variant: SuitVariant;
    selections: SuitSelections;
    totalPrice: number;
    fabricId?: string;
  }) => void;
}

export default function SuitConfiguratorController({
  initialVariant = 'business',
  initialSelections,
  basePrice = 799,
  continueTo = '/configure-fit',
  fabrics,
  onDesignComplete,
}: SuitConfiguratorControllerProps) {
  const router = useRouter();
  const [variant, setVariant] = useState<SuitVariant>(initialVariant);
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(() => {
    if (!fabrics) return null;
    const draft = loadDraftSuitDesign();
    const savedId = draft?.payload?.fabricId;
    return fabrics.find((f) => f.id === savedId) ?? null;
  });

  // Get option set for current variant
  const optionSet = useMemo(() => getSuitOptionSetByVariant(variant), [variant]);

  // Initialize selections with defaults
  const [selections, setSelections] = useState<SuitSelections>(() => {
    // Try loading from draft first
    const draft = loadDraftSuitDesign();
    if (draft && draft.variant === variant) {
      const normalized = normalizeSuitSelections(draft.payload.selections, optionSet);
      return applySuitStyleDefaults(normalized.selections, optionSet);
    }

    // Fall back to props
    if (initialSelections) {
      const normalized = normalizeSuitSelections(initialSelections, optionSet);
      return applySuitStyleDefaults(normalized.selections, optionSet);
    }

    // Default starting state
    return applySuitStyleDefaults({} as SuitSelections, optionSet);
  });

  const pricing = useMemo(
    () => calculateSuitPrice(selections, optionSet),
    [selections, optionSet],
  );

  const validationResult = useMemo(
    () => validateSuitSelections(selections, optionSet),
    [selections, optionSet],
  );

  const totalPrice = basePrice + pricing.total;

  // Handle variant change — reset selections to defaults for new variant
  const handleVariantChange = useCallback(
    (newVariant: SuitVariant) => {
      const newOptionSet = getSuitOptionSetByVariant(newVariant);
      const defaults = applySuitStyleDefaults({}, newOptionSet);
      setVariant(newVariant);
      setSelections(defaults);
    },
    [],
  );

  // Handle selections change
  const handleSelectionsChange = useCallback((next: SuitSelections) => {
    setSelections(next);
    // Auto-save draft for persistence across page reloads
    saveDraftSuitDesign(variant, next, selectedFabric?.id);
  }, [variant, selectedFabric?.id]);

  // Handle design completion
  const handleDesignComplete = useCallback(() => {
    if (!validationResult.isValid) {
      console.warn('Suit design validation failed', validationResult);
      return;
    }

    if (onDesignComplete) {
      onDesignComplete({
        variant,
        selections,
        totalPrice,
        fabricId: selectedFabric?.id,
      });
    } else {
      // Default: Save design and continue to fit
      saveDraftSuitDesign(variant, selections, selectedFabric?.id);
      router.push(continueTo);
    }
  }, [variant, selections, selectedFabric?.id, totalPrice, validationResult, onDesignComplete, continueTo, router]);

  const suitVariants: { value: SuitVariant; label: string; description: string }[] = [
    { value: 'business', label: 'Business Suit', description: 'Professional and versatile' },
    { value: 'wedding', label: 'Wedding Suit', description: 'Formal and elegant' },
    { value: 'casual', label: 'Casual Suit', description: 'Relaxed and modern' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Variant selector */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Suit Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suitVariants.map(({ value, label, description }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleVariantChange(value)}
              className={[
                'relative flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#826300]',
                variant === value
                  ? 'border-[#826300] bg-amber-50'
                  : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50',
              ].join(' ')}
            >
              <span className="font-semibold text-gray-900">{label}</span>
              <span className="text-xs text-gray-600">{description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fabric selector (if fabrics provided) */}
      {fabrics && fabrics.length > 0 && (
        <div className="mb-12">
          <FabricSelector
            fabrics={fabrics}
            selectedId={selectedFabric?.id}
            onSelect={setSelectedFabric}
          />
        </div>
      )}

      {/* Main configurator */}
      <div className="mb-12">
        <GenericMtmConfigurator
          value={selections}
          onChange={handleSelectionsChange}
          optionSet={optionSet}
          basePrice={basePrice}
          title={`Design Your ${suitVariants.find((v) => v.value === variant)?.label || 'Suit'}`}
          ctaLabel="Continue to Fit Profile"
          onComplete={handleDesignComplete}
          currencySymbol="£"
        />
      </div>

      {/* Validation feedback */}
      {!validationResult.isValid && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
          <p className="text-sm font-semibold text-red-900 mb-2">Please complete the design</p>
          {validationResult.missingRequiredKeys.length > 0 && (
            <p className="text-xs text-red-700">
              Missing: {validationResult.missingRequiredKeys.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Clear draft button */}
      <button
        type="button"
        onClick={() => {
          clearDraftSuitDesign();
          setSelections(applySuitStyleDefaults({}, optionSet));
        }}
        className="text-xs text-gray-500 hover:text-gray-700 underline"
      >
        Clear design
      </button>
    </div>
  );
}
