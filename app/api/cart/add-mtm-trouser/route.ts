import { NextResponse } from 'next/server';
import { shopifyStorefrontGraphQL } from '@/lib/shopify/storefront';

interface AddMtmTrouserRequest {
  variantId: string;
  quantity?: number;
  customAttributes: Record<string, string>;
  metadata?: {
    source?: string;
    timestamp?: string;
  };
}

interface ShopifyAddToCartResponse {
  ok?: boolean;
  cartId?: string;
  lineItemId?: string;
  error?: string;
}

/**
 * POST /api/cart/add-mtm-trouser
 *
 * Adds a configured MTM trouser product to the Shopify cart with all design
 * and fit metadata attached as line item custom attributes under the gjm namespace.
 *
 * Request body:
 * {
 *   variantId: "gid://shopify/ProductVariant/...",
 *   quantity: 1,
 *   customAttributes: {
 *     gjm_mtm_category: "trouser",
 *     gjm_trouser_selections: "{...}",
 *     gjm_fit_profile_id: "...",
 *     ... (all gjm_ prefixed attributes)
 *   }
 * }
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: AddMtmTrouserRequest = await req.json();
    const { variantId, quantity = 1, customAttributes } = body;

    if (!variantId) {
      return NextResponse.json(
        { ok: false, error: 'variantId is required' },
        { status: 400 },
      );
    }

    if (!customAttributes || Object.keys(customAttributes).length === 0) {
      return NextResponse.json(
        { ok: false, error: 'customAttributes cannot be empty' },
        { status: 400 },
      );
    }

    // Convert custom attributes to Shopify format
    const attributesInput = Object.entries(customAttributes).map(([key, value]) => ({
      key,
      value,
    }));

    // Get or create cart token from cookies
    const cartToken = getOrCreateCartToken(req);

    // Mutation to add to cart using Storefront API
    const addToCartMutation = `
      mutation AddToCart($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            lines(first: 1) {
              edges {
                node {
                  id
                  quantity
                  attributes {
                    key
                    value
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input = {
      lines: [
        {
          merchandiseId: variantId,
          quantity,
          attributes: attributesInput,
        },
      ],
    };

    const response = await shopifyStorefrontGraphQL(addToCartMutation, { input });

    if (response.errors) {
      console.error('[addMtmTrouser] GraphQL error:', response.errors);
      return NextResponse.json(
        { ok: false, error: response.errors[0]?.message || 'Failed to add to cart' },
        { status: 500 },
      );
    }

    const cart = response.data?.cartCreate?.cart;
    const userErrors = response.data?.cartCreate?.userErrors;

    if (userErrors && userErrors.length > 0) {
      console.error('[addMtmTrouser] User errors:', userErrors);
      return NextResponse.json(
        { ok: false, error: userErrors[0]?.message || 'Failed to add to cart' },
        { status: 400 },
      );
    }

    if (!cart) {
      return NextResponse.json(
        { ok: false, error: 'No cart returned from Shopify' },
        { status: 500 },
      );
    }

    const lineItem = cart.lines?.edges?.[0]?.node;

    return NextResponse.json(
      {
        ok: true,
        cartId: cart.id,
        lineItemId: lineItem?.id,
      },
      {
        headers: {
          'Set-Cookie': `cartToken=${cartToken}; path=/; max-age=2592000; httponly;`,
        },
      },
    );
  } catch (error) {
    console.error('[addMtmTrouser] Exception:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}

/**
 * Helper to get cart token from request cookies.
 * In a real implementation, this would create a new Shopify cart if needed.
 */
function getOrCreateCartToken(req: Request): string {
  const cookies = req.headers.get('cookie') || '';
  const match = cookies.match(/cartToken=([^;]+)/);
  if (match) return match[1];

  // Generate a new cart token (in production, call Shopify API)
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
