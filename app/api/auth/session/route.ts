import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth';
import { clearSessionCookies } from '@/lib/session';
import { getCartCookieName, getLegacyCartCookieName } from '@/lib/shopify/cart';

export async function GET() {
  try {
    const session = await getSessionContext();
    return NextResponse.json({ ok: true, session });
  } catch {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  response.cookies.set(getCartCookieName(), '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
  response.cookies.set(getLegacyCartCookieName(), '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
  response.cookies.set('fit_profile_id', '', {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
  return response;
}