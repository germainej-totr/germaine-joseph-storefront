'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import SavedFitPromptModal from '@/components/SavedFitPromptModal';
import { trackMtmGateEvent } from '@/lib/analytics/trackMtmGateEvent';
import type { MtmGateEventName } from '@/lib/analytics/mtmGateContract';
import { trackNonTailorConfiguratorEvent } from '@/lib/analytics/trackNonTailorConfiguratorEvent';
import { trackMtmFunnelEvent } from '@/lib/analytics/trackMtmFunnelEvent';
import { parseMetafieldBoolean } from '@/lib/metafield';
import type { ProductDetailResponse } from '@/lib/contracts/productApi';

type EntryPath = 'full_mtm_required' | 'saved_fit_eligible' | 'refit_recommended';

interface GateStatusResponse {
  entryPath: EntryPath;
  profileAgeMonths: number | null;
  reason: string;
  fitProfileId: string | null;
  updatedAt: string | null;
  email?: string;
  customerId?: string;
}

interface ProductOption {
  id?: string;
  name: string;
  values: string[];
}

interface ProductVariant {
  id: string;
  title?: string;
  availableForSale?: boolean;
  selectedOptions?: Array<{ name: string; value: string }>;
}

interface ProductData {
  id: string;
  title?: string;
  description?: string;
  productType?: string;
  options?: ProductOption[];
  variants?: ProductVariant[] | { edges?: Array<{ node?: ProductVariant }> };
  mtm_required?: { value?: unknown };
  mtm_category?: { value?: string };
  metafields?: {
    mtm_category?: string;
  };
}

function readCookie(name: string): string | null {
  const cookies = document.cookie.split(';').map((value) => value.trim());
  const found = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!found) return null;
  return found.split('=')[1] || null;
}

export default function ProductPage() {
  const routeParams = useParams<{ handle?: string | string[] }>();
  const pathname = usePathname();
  const rawHandle = routeParams?.handle;
  const routeHandle = Array.isArray(rawHandle) ? rawHandle[0] || '' : rawHandle || '';
  const pathHandle = decodeURIComponent((pathname || '').split('/').filter(Boolean).pop() || '');
  const handle = routeHandle || pathHandle;
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const [mtmRequired, setMtmRequired] = useState(false);
  const [fitProfileId, setFitProfileId] = useState<string | null>(null);
  const [gateStatus, setGateStatus] = useState<GateStatusResponse | null>(null);
  const [showSavedFitPrompt, setShowSavedFitPrompt] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [customNotes, setCustomNotes] = useState('');
  const hasTrackedConfiguratorView = useRef(false);

  const mtmCategory =
    product?.mtm_category?.value ||
    product?.metafields?.mtm_category ||
    'unknown';
  const productType = product?.productType || mtmCategory;

  const productOptions = useMemo(() => {
    return (product?.options || []) as ProductOption[];
  }, [product]);

  const variants = useMemo(() => {
    const rawVariants = product?.variants;

    if (Array.isArray(rawVariants)) {
      return rawVariants as ProductVariant[];
    }

    const edges = rawVariants?.edges;
    if (Array.isArray(edges)) {
      return edges
        .map((edge: { node?: ProductVariant }) => edge?.node)
        .filter((variant: ProductVariant | undefined): variant is ProductVariant => Boolean(variant));
    }

    return [] as ProductVariant[];
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    if (!productOptions.length) return variants[0] || null;

    const matched = variants.find((variant) => {
      const opts = variant.selectedOptions || [];
      return productOptions.every((option) => {
        const expected = selectedOptions[option.name];
        if (!expected) return true;
        const variantValue = opts.find((item) => item.name === option.name)?.value;
        return variantValue === expected;
      });
    });

    return matched || variants[0] || null;
  }, [variants, productOptions, selectedOptions]);

  const variantId = selectedVariant?.id;

  const isNonTailorConfigurable = useMemo(() => {
    const category = String(mtmCategory || '').toLowerCase();
    const normalizedProductType = String(productType || '').toLowerCase();
    if (mtmRequired) return false;
    return (
      category.includes('shoe') ||
      category.includes('leather') ||
      normalizedProductType.includes('shoe') ||
      normalizedProductType.includes('leather')
    );
  }, [mtmCategory, mtmRequired, productType]);

  const hasSoldOutSelection = selectedVariant?.availableForSale === false;

  useEffect(() => {
    async function boot() {
      if (!handle) {
        setProduct(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const res = await fetch(`/api/products/${encodeURIComponent(handle)}`, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Product API HTTP ${res.status}`);
        }

        const json = (await res.json()) as ProductDetailResponse;
        const nextProduct = (json?.product as ProductData | null) ?? null;
        setProduct(nextProduct);

        if (!nextProduct) {
          console.error('Product API returned null product', { handle, json });
        }

        const nextMtmCategory =
          nextProduct?.mtm_category?.value ||
          nextProduct?.metafields?.mtm_category ||
          'unknown';
        const nextProductType = nextProduct?.productType || nextMtmCategory;
        const initialVariantId = Array.isArray(nextProduct?.variants)
          ? nextProduct?.variants?.[0]?.id
          : nextProduct?.variants?.edges?.[0]?.node?.id;

        const required = parseMetafieldBoolean(nextProduct?.mtm_required?.value);
        setMtmRequired(required);

        const profileId = readCookie('fit_profile_id');
        setFitProfileId(profileId);

        if (!required) {
          setGateStatus(null);
          setLoading(false);
          return;
        }

        const gateRes = await fetch(`/api/fit/gate-status?fitProfileId=${encodeURIComponent(profileId || '')}`);
        const gate = (await gateRes.json()) as GateStatusResponse;
        setGateStatus(gate);

        const profileAgeDays =
          typeof gate.profileAgeMonths === 'number' ? Math.round(gate.profileAgeMonths * 30.4) : undefined;

        const decisionMap: Record<string, MtmGateEventName> = {
          full_mtm_required: 'gjm_gate_full_mtm_required',
          saved_fit_eligible: 'gjm_gate_saved_fit_eligible',
          refit_recommended: 'gjm_gate_refit_recommended',
          unauthenticated: 'gjm_gate_unauthenticated',
          profile_not_owned: 'gjm_gate_profile_not_owned',
        };

        const decisionEvent = decisionMap[gate.reason] || decisionMap[gate.entryPath] || 'gjm_gate_full_mtm_required';
        trackMtmGateEvent(decisionEvent, {
          product_handle: handle,
          product_type: String(nextProductType || 'unknown'),
          mtm_category: String(nextMtmCategory || 'unknown'),
          variant_id: String(initialVariantId || ''),
          customer_id: gate.customerId,
          fit_profile_id: gate.fitProfileId || profileId || undefined,
          gate_decision: gate.entryPath,
          gate_reason: gate.reason,
          profile_age_days: profileAgeDays,
        });

        trackMtmFunnelEvent('gjm_mtm_configurator_start', {
          product_handle: handle,
          product_type: String(nextProductType || 'unknown'),
          mtm_category: String(nextMtmCategory || 'unknown'),
          variant_id: String(initialVariantId || ''),
          customer_id: gate.customerId,
          fit_profile_id: gate.fitProfileId || profileId || undefined,
          entry_path:
            gate.entryPath === 'saved_fit_eligible'
              ? 'saved_fit'
              : gate.entryPath === 'refit_recommended'
                ? 'refit'
                : 'full_mtm',
          funnel_step: 'configurator_start',
          source: 'gjm_product_pdp',
        });
      } catch (error) {
        console.error('Failed to load PDP product', { handle, error });
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, [handle]);

  useEffect(() => {
    if (!productOptions.length) {
      setSelectedOptions({});
      return;
    }

    const defaults: Record<string, string> = {};
    for (const option of productOptions) {
      if (option.values?.length) {
        defaults[option.name] = option.values[0];
      }
    }
    setSelectedOptions(defaults);
  }, [productOptions]);

  useEffect(() => {
    if (!showSavedFitPrompt || !gateStatus) return;

    const eventName: MtmGateEventName =
      gateStatus.entryPath === 'refit_recommended'
        ? 'gjm_refit_recommended_modal_shown'
        : 'gjm_saved_fit_modal_shown';

    const profileAgeDays =
      typeof gateStatus.profileAgeMonths === 'number'
        ? Math.round(gateStatus.profileAgeMonths * 30.4)
        : undefined;

    trackMtmGateEvent(eventName, {
      product_handle: handle,
      product_type: String(productType || 'unknown'),
      mtm_category: String(mtmCategory || 'unknown'),
      variant_id: String(variantId || ''),
      customer_id: gateStatus.customerId,
      fit_profile_id: gateStatus.fitProfileId || fitProfileId || undefined,
      gate_decision: gateStatus.entryPath,
      gate_reason: gateStatus.reason,
      profile_age_days: profileAgeDays,
    });
  }, [showSavedFitPrompt, gateStatus, handle, productType, mtmCategory, variantId, fitProfileId]);

  useEffect(() => {
    if (!isNonTailorConfigurable || !product || loading || hasTrackedConfiguratorView.current) return;

    hasTrackedConfiguratorView.current = true;
    trackNonTailorConfiguratorEvent('gjm_non_tailor_config_view', {
      product_handle: handle,
      product_type: String(productType || 'unknown'),
      mtm_category: String(mtmCategory || 'unknown'),
      variant_id: variantId,
      fit_profile_id: fitProfileId || undefined,
      selected_options_count: Object.keys(selectedOptions).length,
      custom_notes_present: Boolean(customNotes.trim()),
      source: 'gjm_product_pdp',
    });
  }, [
    isNonTailorConfigurable,
    product,
    loading,
    handle,
    productType,
    mtmCategory,
    variantId,
    fitProfileId,
    selectedOptions,
    customNotes,
  ]);

  useEffect(() => {
    hasTrackedConfiguratorView.current = false;
  }, [handle]);

  const lastUpdatedLabel = useMemo(() => {
    if (!gateStatus?.updatedAt) return 'Unknown';
    const date = new Date(gateStatus.updatedAt);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString();
  }, [gateStatus?.updatedAt]);

  async function addToCart(payload?: {
    fitProfileId?: string | null;
    productFlow?: 'mtm' | 'rtw' | 'configurable_non_tailor';
    customAttributes?: Array<{ key: string; value: string }>;
  }) {
    if (!product) return;
    if (!variantId) {
      alert('Unable to resolve a purchasable variant for this product.');
      return;
    }

    setAddingToCart(true);

    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId,
          quantity: 1,
          fitProfileId: payload?.fitProfileId,
          productFlow: payload?.productFlow,
          customAttributes: payload?.customAttributes,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to add to cart');
      }

      window.location.href = '/cart';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Unable to add with saved fit: ${message}`);
    } finally {
      setAddingToCart(false);
      setShowSavedFitPrompt(false);
    }
  }

  async function addToCartWithSavedFit() {
    const profileAgeDays =
      typeof gateStatus?.profileAgeMonths === 'number'
        ? Math.round(gateStatus.profileAgeMonths * 30.4)
        : undefined;

    trackMtmGateEvent('gjm_use_saved_fit_clicked', {
      product_handle: handle,
      product_type: String(productType || 'unknown'),
      mtm_category: String(mtmCategory || 'unknown'),
      variant_id: String(variantId || ''),
      customer_id: gateStatus?.customerId,
      fit_profile_id: gateStatus?.fitProfileId || fitProfileId || undefined,
      gate_decision: gateStatus?.entryPath,
      gate_reason: gateStatus?.reason,
      profile_age_days: profileAgeDays,
    });

    await addToCart({
      fitProfileId,
      productFlow: 'mtm',
    });
  }

  async function addToCartAsReadyToWear() {
    await addToCart({
      productFlow: 'rtw',
    });
  }

  async function addConfigurableNonTailorToCart() {
    const optionAttributes = Object.entries(selectedOptions)
      .filter(([, value]) => Boolean(value))
      .map(([name, value]) => ({
        key: `gjm_config_option_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        value,
      }));

    const customAttributes = [...optionAttributes];
    if (customNotes.trim()) {
      customAttributes.push({ key: 'gjm_custom_notes', value: customNotes.trim() });
    }

    trackNonTailorConfiguratorEvent('gjm_non_tailor_config_add_to_cart', {
      product_handle: handle,
      product_type: String(productType || 'unknown'),
      mtm_category: String(mtmCategory || 'unknown'),
      variant_id: variantId,
      fit_profile_id: fitProfileId || undefined,
      selected_options_count: optionAttributes.length,
      custom_notes_present: Boolean(customNotes.trim()),
      source: 'gjm_product_pdp',
    });

    await addToCart({
      productFlow: 'configurable_non_tailor',
      customAttributes,
    });
  }

  function startFullMtmFlow() {
    const profileAgeDays =
      typeof gateStatus?.profileAgeMonths === 'number'
        ? Math.round(gateStatus.profileAgeMonths * 30.4)
        : undefined;

    trackMtmGateEvent('gjm_start_new_fitting_clicked', {
      product_handle: handle,
      product_type: String(productType || 'unknown'),
      mtm_category: String(mtmCategory || 'unknown'),
      variant_id: String(variantId || ''),
      customer_id: gateStatus?.customerId,
      fit_profile_id: gateStatus?.fitProfileId || fitProfileId || undefined,
      gate_decision: gateStatus?.entryPath,
      gate_reason: gateStatus?.reason,
      profile_age_days: profileAgeDays,
    });

    const query = new URLSearchParams();
    if (variantId) query.set('variantId', variantId);
    if (product?.title) query.set('productTitle', product.title);
    query.set('productHandle', handle);

    window.location.href = `/configure-fit?${query.toString()}`;
  }

  async function handleStartCustomization() {
    if (!mtmRequired) {
      if (isNonTailorConfigurable) {
        await addConfigurableNonTailorToCart();
      } else {
        await addToCartAsReadyToWear();
      }
      return;
    }

    if (!gateStatus) {
      startFullMtmFlow();
      return;
    }

    if (gateStatus.entryPath === 'saved_fit_eligible' || gateStatus.entryPath === 'refit_recommended') {
      setShowSavedFitPrompt(true);
      return;
    }

    startFullMtmFlow();
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!product) {
    return <div className="p-8">Product not found</div>;
  }

  const buttonLabel = mtmRequired
    ? 'Start Customisation'
    : isNonTailorConfigurable
      ? 'Customize & Add to Cart'
      : 'Add to Cart';

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{product.title}</h1>
      <p className="mt-4 text-gray-600">{product.description}</p>

      {isNonTailorConfigurable && productOptions.length > 0 && (
        <div className="mt-6 rounded-lg border border-zinc-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Configuration</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {productOptions.map((option) => (
              <label key={option.name} className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-zinc-700">{option.name}</span>
                <select
                  value={selectedOptions[option.name] || ''}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    trackNonTailorConfiguratorEvent('gjm_non_tailor_config_option_change', {
                      product_handle: handle,
                      product_type: String(productType || 'unknown'),
                      mtm_category: String(mtmCategory || 'unknown'),
                      variant_id: variantId,
                      fit_profile_id: fitProfileId || undefined,
                      option_name: option.name,
                      option_value: nextValue,
                      selected_options_count: Object.keys(selectedOptions).length,
                      custom_notes_present: Boolean(customNotes.trim()),
                      source: 'gjm_product_pdp',
                    });
                    trackMtmFunnelEvent('gjm_mtm_option_change', {
                      product_handle: handle,
                      product_type: String(productType || 'unknown'),
                      mtm_category: String(mtmCategory || 'unknown'),
                      variant_id: variantId,
                      fit_profile_id: fitProfileId || undefined,
                      option_name: option.name,
                      option_value: nextValue,
                      funnel_step: 'option_change',
                      source: 'gjm_product_pdp',
                    });
                    setSelectedOptions((prev) => ({ ...prev, [option.name]: nextValue }));
                  }}
                  className="rounded border border-zinc-300 px-3 py-2"
                >
                  {option.values.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <label className="mt-4 flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Customization notes (optional)</span>
            <textarea
              value={customNotes}
              onChange={(event) => setCustomNotes(event.target.value)}
              className="min-h-[92px] rounded border border-zinc-300 px-3 py-2"
              placeholder="Any finishing details, initials, or preferences for our atelier."
            />
          </label>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={handleStartCustomization}
          disabled={addingToCart || !variantId || hasSoldOutSelection}
          className="rounded bg-black px-4 py-3 text-white disabled:bg-gray-400"
        >
          {addingToCart ? 'Processing...' : buttonLabel}
        </button>

        {!variantId && (
          <p className="text-sm text-red-600">No valid variant is currently available for this selection.</p>
        )}

        {hasSoldOutSelection && (
          <p className="text-sm text-red-600">This selected configuration is currently sold out.</p>
        )}

        {mtmRequired && gateStatus?.entryPath === 'full_mtm_required' && (
          <p className="text-sm text-red-600">
            A fit profile is required before purchase. Please complete your fitting workflow.
          </p>
        )}

        {mtmRequired && gateStatus?.entryPath === 'saved_fit_eligible' && (
          <p className="text-sm text-zinc-600">
            Saved fit found. You can continue with saved measurements or update your fitting.
          </p>
        )}

        {mtmRequired && gateStatus?.entryPath === 'refit_recommended' && (
          <p className="text-sm text-amber-700">
            Your fit profile may be out of date. We recommend a fit refresh before checkout.
          </p>
        )}
      </div>

      <SavedFitPromptModal
        isOpen={showSavedFitPrompt}
        mode={gateStatus?.entryPath === 'refit_recommended' ? 'refit_recommended' : 'saved_fit_eligible'}
        lastUpdatedLabel={lastUpdatedLabel}
        isLoading={addingToCart}
        onUseSavedFit={addToCartWithSavedFit}
        onRequireNewFit={startFullMtmFlow}
        onClose={() => setShowSavedFitPrompt(false)}
      />
    </div>
  );
}
