import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  addLinesToShopifyCart,
  createShopifyCart,
  getCartCookieName,
  parseCartIdFromCookieHeader,
} from '@/lib/shopify/cart';
import { normalizeGjmLineItemAttributes, toShopifyAttributeInput } from '@/lib/shopify/gjmLineItemAttributes';
import { ADD_MTM_ITEM_REQUEST_SCHEMA, type AddMtmItemRequest } from '@/lib/contracts/apiSchemas';
import { captureMtmFunnelEvent } from '@/lib/analytics/captureMtmFunnelEvent';
import { deriveCategoryAnalyticsFields } from '@/lib/analytics/mtmCategoryAnalytics';

function isRecoverableCartError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('cart') && (message.includes('not found') || message.includes('invalid') || message.includes('does not exist'));
}

async function validateMtmItemOwnership(
  customAttributes: Record<string, string>,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const fitProfileId =
    customAttributes.gjm_fit_profile_id ||
    customAttributes.fit_profile_id ||
    '';

  // Some MTM payloads may be incomplete in early flows; only enforce when profile is present.
  if (!fitProfileId) {
    return { ok: true };
  }

  let sessionEmail = '';
  let sessionCustomerId = '';

  try {
    const session = await getSessionContext();
    sessionEmail = session.email;
    sessionCustomerId = session.customerId;
  } catch {
    return { ok: false, status: 401, error: 'unauthorized' };
  }

  const profile = await prisma.fitProfile.findUnique({
    where: { id: fitProfileId },
    select: {
      id: true,
      email: true,
      customerId: true,
      isActive: true,
    },
  });

  if (!profile || !profile.isActive) {
    return { ok: false, status: 400, error: 'invalid_fit_profile' };
  }

  const ownedByCustomerId = !!profile.customerId && profile.customerId === sessionCustomerId;
  const ownedByEmail = (profile.email || '').toLowerCase() === sessionEmail;
  if (!ownedByCustomerId && !ownedByEmail) {
    return { ok: false, status: 403, error: 'fit_profile_not_owned' };
  }

  return { ok: true };
}

/**
 * POST /api/cart/add-mtm-item
 *
 * Generic endpoint to add any configured MTM item to the Shopify cart with full metadata.
 * Works with any MTM category (trouser, jacket, etc.) by accepting mapped line item attributes.
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
 *   },
 *   metadata?: {
 *     source: "mtm_configurator_v1",
 *     timestamp: "2026-03-28T..."
 *   }
 * }
 *
 * Response (success):
 * {
 *   ok: true,
 *   cartId: "gid://shopify/Cart/...",
 *   checkoutUrl: "https://..."
 * }
 *
 * Response (error):
 * {
 *   ok: false,
 *   error: "error_code",
 *   status: 400|401|403|500
 * }
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const parsed = ADD_MTM_ITEM_REQUEST_SCHEMA.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const body: AddMtmItemRequest = parsed.data;
    const { variantId, quantity = 1, customAttributes } = body;

    const normalizedAttributes = normalizeGjmLineItemAttributes({
      customAttributes,
    });

    const ownershipCheck = await validateMtmItemOwnership(normalizedAttributes);
    if (!ownershipCheck.ok) {
      return NextResponse.json(
        { ok: false, error: ownershipCheck.error },
        { status: ownershipCheck.status },
      );
    }

    // Convert custom attributes to Shopify format
    const attributesInput = toShopifyAttributeInput(normalizedAttributes);

    const existingCartId = parseCartIdFromCookieHeader(req.headers.get('cookie'));
    let cart;

    if (existingCartId) {
      try {
        cart = await addLinesToShopifyCart({
          cartId: existingCartId,
          variantId,
          quantity,
          attributes: attributesInput,
        });
      } catch (error) {
        if (!isRecoverableCartError(error)) {
          throw error;
        }

        cart = await createShopifyCart({
          variantId,
          quantity,
          attributes: attributesInput,
        });
      }
    } else {
      cart = await createShopifyCart({
        variantId,
        quantity,
        attributes: attributesInput,
      });
    }

    const lineItem = cart.lines?.edges?.[0]?.node;

    const mtmCategory =
      normalizedAttributes.gjm_mtm_category ||
      normalizedAttributes.mtm_category ||
      'mtm';
    const categoryFields = deriveCategoryAnalyticsFields(mtmCategory, normalizedAttributes);

    captureMtmFunnelEvent({
      event_name: 'gjm_mtm_cart_add',
      occurred_at: new Date().toISOString(),
      mtm_category: mtmCategory,
      variant_id: variantId,
      fit_profile_id: normalizedAttributes.gjm_fit_profile_id || undefined,
      entry_path: normalizedAttributes.gjm_fit_profile_id ? 'saved_fit' : 'full_mtm',
      funnel_step: 'cart_add',
      source: 'api/cart/add-mtm-item',
      properties: categoryFields,
    }).catch((err) => console.error('gjm_mtm_cart_add event emit failed:', err));

    if (cart.checkoutUrl) {
      captureMtmFunnelEvent({
        event_name: 'gjm_mtm_checkout_start',
        occurred_at: new Date().toISOString(),
        mtm_category: mtmCategory,
        variant_id: variantId,
        fit_profile_id: normalizedAttributes.gjm_fit_profile_id || undefined,
        entry_path: normalizedAttributes.gjm_fit_profile_id ? 'saved_fit' : 'full_mtm',
        funnel_step: 'checkout_start',
        source: 'api/cart/add-mtm-item',
        properties: categoryFields,
      }).catch((err) => console.error('gjm_mtm_checkout_start event emit failed:', err));
    }

    const response = NextResponse.json(
      {
        ok: true,
        cartId: cart.id,
        checkoutUrl: cart.checkoutUrl,
        lineItemId: lineItem?.id,
      },
    );

    response.cookies.set(getCartCookieName(), cart.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set('shopify_cart_id', cart.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error('[POST /api/cart/add-mtm-item]', error);
    const message = error instanceof Error ? error.message : 'Failed to add MTM item to cart';
    return NextResponse.json(
      { ok: false, error: 'internal_error', details: message },
      { status: 500 },
    );
  }
}
