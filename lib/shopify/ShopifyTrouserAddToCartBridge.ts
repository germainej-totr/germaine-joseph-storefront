'use client';

import { useRouter } from 'next/navigation';
import type { CanonicalTrouserMtmPayload } from '@/lib/trouser/TrouserMtmPayload';
import {
  mapCanonicalPayloadToLineItemAttributes,
} from '@/lib/shopify/ShopifyMtmCartMapper';

/**
 * Bridge between fit completion and Shopify cart add.
 *
 * When a user completes fit intake, this bridge:
 * 1. Takes the canonical MTM payload
 * 2. Serializes it into Shopify line item attributes
 * 3. Constructs the product add-to-cart request
 * 4. Routes to cart/checkout
 */

export interface AddTrouserToCartInput {
  variantId: string;
  quantity?: number;
  canonicalPayload: CanonicalTrouserMtmPayload;
  redirectTo?: string;
}

export interface AddTrouserToCartResult {
  ok: boolean;
  cartId?: string;
  error?: string;
}

/**
 * Client-side hook to add a configured trouser to cart with MTM metadata.
 * Calls the backend endpoint that handles Shopify cart mutation.
 */
export async function addTrouserToCart(input: AddTrouserToCartInput): Promise<AddTrouserToCartResult> {
  try {
    const lineItemAttributes = mapCanonicalPayloadToLineItemAttributes(input.canonicalPayload);

    const response = await fetch('/api/cart/add-mtm-trouser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: input.variantId,
        quantity: input.quantity ?? 1,
        customAttributes: lineItemAttributes,
        metadata: {
          source: 'trouser_configrator_v1',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[addTrouserToCart] API error:', error);
      return {
        ok: false,
        error: `Failed to add to cart: ${response.status}`,
      };
    }

    const result = await response.json();

    if (result.ok || result.cartId) {
      return {
        ok: true,
        cartId: result.cartId,
      };
    }

    return {
      ok: false,
      error: result.error || 'Unknown cart error',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[addTrouserToCart] Exception:', message);
    return {
      ok: false,
      error: message,
    };
  }
}

/**
 * React hook for handling trouser add-to-cart with user feedback and routing.
 */
export function useTrouserCheckout() {
  const router = useRouter();

  return async (input: AddTrouserToCartInput): Promise<boolean> => {
    const result = await addTrouserToCart(input);

    if (!result.ok) {
      alert(`Error adding to cart: ${result.error}`);
      return false;
    }

    const redirectTo = input.redirectTo ?? '/cart';
    router.push(redirectTo);
    return true;
  };
}
