'use client';

import { useRouter } from 'next/navigation';
import type { CanonicalTrouserMtmPayload } from '@/lib/trouser/TrouserMtmPayload';
import {
  mapCanonicalPayloadToLineItemAttributes,
} from '@/lib/shopify/ShopifyMtmCartMapper';

/**
 * Generic bridge between MTM configuration completion and Shopify cart add.
 *
 * Works with any canonical MTM payload (not just trouser).
 * When a user completes design configuration, this bridge:
 * 1. Takes the canonical MTM payload
 * 2. Serializes it into Shopify line item attributes
 * 3. Constructs the product add-to-cart request
 * 4. Routes to cart/checkout
 */

export interface AddMtmItemToCartInput {
  /**
   * Shopify product variant ID (GraphQL ID format: gid://shopify/ProductVariant/...)
   */
  variantId: string;
  /**
   * Quantity of items to add (default: 1)
   */
  quantity?: number;
  /**
   * Canonical MTM payload carrying complete design + fit context
   */
  canonicalPayload: CanonicalTrouserMtmPayload;
  /**
   * Optional redirect target after successful add-to-cart
   */
  redirectTo?: string;
}

export interface AddMtmItemToCartResult {
  ok: boolean;
  cartId?: string;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Client-side function to add a configured MTM item to cart with full metadata.
 * Makes POST request to backend endpoint that handles Shopify cart mutation.
 */
export async function addMtmItemToCart(
  input: AddMtmItemToCartInput,
): Promise<AddMtmItemToCartResult> {
  try {
    const lineItemAttributes = mapCanonicalPayloadToLineItemAttributes(
      input.canonicalPayload,
    );

    const response = await fetch('/api/cart/add-mtm-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: input.variantId,
        quantity: input.quantity ?? 1,
        customAttributes: lineItemAttributes,
        metadata: {
          source: 'mtm_configurator_v1',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[addMtmItemToCart] API error:', error);
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
        checkoutUrl: result.checkoutUrl,
      };
    }

    return {
      ok: false,
      error: result.error || 'Unknown cart error',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[addMtmItemToCart] Exception:', message);
    return {
      ok: false,
      error: message,
    };
  }
}

/**
 * React hook for handling MTM add-to-cart with user feedback and routing.
 *
 * Usage:
 * ```
 * const handleCheckout = useMtmCheckout();
 * await handleCheckout({
 *   variantId: 'gid://...',
 *   canonicalPayload: payload,
 *   redirectTo: '/cart'
 * });
 * ```
 */
export function useMtmCheckout() {
  const router = useRouter();

  return async (input: AddMtmItemToCartInput): Promise<boolean> => {
    const result = await addMtmItemToCart(input);

    if (!result.ok) {
      alert(`Error adding to cart: ${result.error}`);
      return false;
    }

    const redirectTo = input.redirectTo ?? '/cart';
    router.push(redirectTo);
    return true;
  };
}
