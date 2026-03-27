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
import { ADD_MTM_TROUSER_REQUEST_SCHEMA, type AddMtmTrouserRequest } from '@/lib/contracts/apiSchemas';

function isRecoverableCartError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('cart') && (message.includes('not found') || message.includes('invalid') || message.includes('does not exist'));
}

async function validateMtmTrouserOwnership(
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
    const parsed = ADD_MTM_TROUSER_REQUEST_SCHEMA.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const body: AddMtmTrouserRequest = parsed.data;
    const { variantId, quantity = 1, customAttributes } = body;

    const normalizedAttributes = normalizeGjmLineItemAttributes({
      customAttributes,
    });

    const ownershipCheck = await validateMtmTrouserOwnership(normalizedAttributes);
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

    return NextResponse.json(
      {
        ok: true,
        cartId: cart.id,
        lineItemId: lineItem?.id,
      },
      {
        headers: {
          'Set-Cookie': `${getCartCookieName()}=${cart.id}; path=/; max-age=2592000; httponly; samesite=lax`,
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
