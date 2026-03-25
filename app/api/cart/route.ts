import { NextResponse } from 'next/server';
import {
  fetchShopifyCart,
  getCartCookieName,
  parseCartIdFromCookieHeader,
  removeShopifyCartLine,
  updateShopifyCartLine,
} from '@/lib/shopify/cart';

export async function GET(req: Request) {
  try {
    const cartId = parseCartIdFromCookieHeader(req.headers.get('cookie'));
    if (!cartId) {
      return NextResponse.json({ ok: true, cart: null, lines: [] });
    }

    const cart = await fetchShopifyCart(cartId);
    if (!cart) {
      const response = NextResponse.json({ ok: true, cart: null, lines: [] });
      response.cookies.set(getCartCookieName(), '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires: new Date(0),
      });
      return response;
    }

    const lines = (cart.lines?.edges ?? []).map((edge) => edge.node);
    return NextResponse.json({ ok: true, cart, lines });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cartId = parseCartIdFromCookieHeader(req.headers.get('cookie'));
    if (!cartId) {
      return NextResponse.json({ ok: false, error: 'cart_not_found' }, { status: 400 });
    }

    const body = (await req.json()) as { lineId?: string; quantity?: number };
    if (!body.lineId || !Number.isFinite(body.quantity)) {
      return NextResponse.json({ ok: false, error: 'lineId and quantity are required' }, { status: 400 });
    }

    const quantity = Math.max(0, Math.floor(body.quantity || 0));
    const cart = quantity > 0
      ? await updateShopifyCartLine({ cartId, lineId: body.lineId, quantity })
      : await removeShopifyCartLine({ cartId, lineId: body.lineId });

    const lines = (cart.lines?.edges ?? []).map((edge) => edge.node);
    return NextResponse.json({ ok: true, cart, lines });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const cartId = parseCartIdFromCookieHeader(req.headers.get('cookie'));
    if (!cartId) {
      return NextResponse.json({ ok: false, error: 'cart_not_found' }, { status: 400 });
    }

    const body = (await req.json()) as { lineId?: string };
    if (!body.lineId) {
      return NextResponse.json({ ok: false, error: 'lineId is required' }, { status: 400 });
    }

    const cart = await removeShopifyCartLine({ cartId, lineId: body.lineId });
    const lines = (cart.lines?.edges ?? []).map((edge) => edge.node);
    return NextResponse.json({ ok: true, cart, lines });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}