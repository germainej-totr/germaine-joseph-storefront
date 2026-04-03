'use client';

export interface AddMtmItemToCartInput {
  variantId: string;
  quantity?: number;
  customAttributes: Record<string, string>;
  redirectTo?: string;
}

export interface AddMtmItemToCartResult {
  ok: boolean;
  cartId?: string;
  error?: string;
}

export async function addMtmItemToCart(input: AddMtmItemToCartInput): Promise<AddMtmItemToCartResult> {
  try {
    const response = await fetch('/api/cart/add-mtm-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: input.variantId,
        quantity: input.quantity ?? 1,
        customAttributes: input.customAttributes,
        metadata: {
          source: 'generic_mtm_configurator_v1',
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
