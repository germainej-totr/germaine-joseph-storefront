'use client';

import { useEffect, useMemo, useState } from 'react';
import SavedFitPromptModal from '@/components/SavedFitPromptModal';
import { trackMtmGateEvent } from '@/lib/analytics/trackMtmGateEvent';
import type { MtmGateEventName } from '@/lib/analytics/mtmGateContract';

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

function readCookie(name: string): string | null {
  const cookies = document.cookie.split(';').map((value) => value.trim());
  const found = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!found) return null;
  return found.split('=')[1] || null;
}

export default function ProductPage({ params }: { params: { handle: string } }) {
  const handle = params.handle;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const [mtmRequired, setMtmRequired] = useState(false);
  const [fitProfileId, setFitProfileId] = useState<string | null>(null);
  const [gateStatus, setGateStatus] = useState<GateStatusResponse | null>(null);
  const [showSavedFitPrompt, setShowSavedFitPrompt] = useState(false);

  const mtmCategory =
    product?.mtm_category?.value ||
    product?.metafields?.mtm_category ||
    'unknown';
  const productType = product?.productType || mtmCategory;
  const variantId = product?.variants?.[0]?.id as string | undefined;

  useEffect(() => {
    async function boot() {
      setLoading(true);

      const res = await fetch(`/api/products/${handle}`);
      const json = await res.json();
      const nextProduct = json.product;
      setProduct(nextProduct);

      const required = nextProduct?.metafields?.mtm_required === 'true';
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
        product_type: String(productType || 'unknown'),
        mtm_category: String(mtmCategory || 'unknown'),
        variant_id: String(nextProduct?.variants?.[0]?.id || ''),
        customer_id: gate.customerId,
        fit_profile_id: gate.fitProfileId || profileId || undefined,
        gate_decision: gate.entryPath,
        gate_reason: gate.reason,
        profile_age_days: profileAgeDays,
      });

      setLoading(false);
    }

    boot();
  }, [handle]);

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

  const lastUpdatedLabel = useMemo(() => {
    if (!gateStatus?.updatedAt) return 'Unknown';
    const date = new Date(gateStatus.updatedAt);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString();
  }, [gateStatus?.updatedAt]);

  async function addToCartWithSavedFit() {
    if (!product) return;

    setAddingToCart(true);

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

    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId,
          quantity: 1,
          fitProfileId,
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

  function handleStartCustomization() {
    if (!mtmRequired) {
      addToCartWithSavedFit();
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

  const buttonLabel = mtmRequired ? 'Start Customisation' : 'Add to Cart';

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{product.title}</h1>
      <p className="mt-4 text-gray-600">{product.description}</p>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={handleStartCustomization}
          disabled={addingToCart}
          className="rounded bg-black px-4 py-3 text-white disabled:bg-gray-400"
        >
          {addingToCart ? 'Processing...' : buttonLabel}
        </button>

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
