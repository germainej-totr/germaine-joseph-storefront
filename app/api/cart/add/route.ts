import { NextResponse } from 'next/server';
import { CartAddRequest } from '@/types/booking';
import { getSessionContext } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  addLinesToShopifyCart,
  createShopifyCart,
  getCartCookieName,
  parseCartIdFromCookieHeader,
} from '@/lib/shopify/cart';

function isRecoverableCartError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('cart') && (message.includes('not found') || message.includes('invalid') || message.includes('does not exist'));
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

function buildLineItemAttributes(body: CartAddRequest): Array<{ key: string; value: string }> {
  const attributes: Array<{ key: string; value: string }> = [];

  if (body.productFlow) {
    attributes.push({ key: 'gjm_product_flow', value: body.productFlow });
  }

  if (body.fitProfileId) {
    attributes.push({ key: 'fit_profile_id', value: body.fitProfileId });
    attributes.push({ key: 'gjm_fit_profile_id', value: body.fitProfileId });
  }

  if (body.fitGateVersion) {
    attributes.push({ key: 'gjm_fit_gate_version', value: body.fitGateVersion });
  }

  if (body.mtmSpec) {
    attributes.push({ key: 'gjm_mtm_spec', value: safeStringify(body.mtmSpec) });
  }

  if (body.mtmOptions && Object.keys(body.mtmOptions).length > 0) {
    attributes.push({ key: 'gjm_mtm_options', value: safeStringify(body.mtmOptions) });
  }

  if (body.measurements && Object.keys(body.measurements).length > 0) {
    attributes.push({ key: 'gjm_measurements', value: safeStringify(body.measurements) });
  }

  for (const [key, value] of Object.entries(body.customAttributes ?? {})) {
    attributes.push({ key, value });
  }

  return attributes;
}

async function validateMtmOwnership(body: CartAddRequest): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (body.productFlow !== 'mtm_tailored' || !body.fitProfileId) {
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
    where: { id: body.fitProfileId },
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

export async function POST(req: Request) {
  try {
    const body: CartAddRequest = await req.json();
    const { variantId, quantity } = body;

    if (!variantId) {
      return NextResponse.json({ ok: false, error: 'variantId is required' }, { status: 400 });
    }

    const ownershipCheck = await validateMtmOwnership(body);
    if (!ownershipCheck.ok) {
      return NextResponse.json({ ok: false, error: ownershipCheck.error }, { status: ownershipCheck.status });
    }

    const customAttributes = buildLineItemAttributes(body);

    const existingCartId = parseCartIdFromCookieHeader(req.headers.get('cookie'));
    let cart;

    if (existingCartId) {
      try {
        cart = await addLinesToShopifyCart({
          cartId: existingCartId,
          variantId,
          quantity: quantity ?? 1,
          attributes: customAttributes,
        });
      } catch (error) {
        if (!isRecoverableCartError(error)) {
          throw error;
        }

        cart = await createShopifyCart({
          variantId,
          quantity: quantity ?? 1,
          attributes: customAttributes,
        });
      }
    } else {
      cart = await createShopifyCart({
        variantId,
        quantity: quantity ?? 1,
        attributes: customAttributes,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        cartId: cart.id,
        checkoutUrl: cart.checkoutUrl,
      },
      {
        headers: {
          'Set-Cookie': `${getCartCookieName()}=${cart.id}; path=/; max-age=2592000; httponly; samesite=lax`,
        },
      },
    );
  } catch (error) {
    console.error('Error adding to cart:', error);
    const message = error instanceof Error ? error.message : 'Failed to add to cart';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}