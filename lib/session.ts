import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { NextResponse } from 'next/server';

export interface AppSessionPayload {
  sessionId: string;
  customerId: string;
  email: string;
  expiresAt: string;
}

interface SignedPayloadBase {
  expiresAt: string;
}

export interface EmailLinkChallengePayload extends SignedPayloadBase {
  email: string;
  customerGid: string;
  code: string;
}

export interface BookingManageTokenPayload extends SignedPayloadBase {
  bookingId: string;
  email: string;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const LINK_CHALLENGE_TTL_MS = 1000 * 60 * 10;
const BOOKING_MANAGE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function encode(input: string) {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function decode(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function getSessionSecret() {
  const secret =
    process.env.APP_SESSION_SECRET ||
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ||
    process.env.SHOPIFY_ADMIN_API_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!secret) {
    throw new Error('Missing session secret configuration');
  }

  return secret;
}

function signPayload(encodedPayload: string) {
  return createHmac('sha256', getSessionSecret()).update(encodedPayload).digest('base64url');
}

function serializeSignedPayload(payload: SignedPayloadBase) {
  const json = JSON.stringify(payload);
  const encodedPayload = encode(json);
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function parseSignedPayload<T extends SignedPayloadBase>(serialized: string | undefined | null): T | null {
  if (!serialized) return null;

  const [encodedPayload, receivedSignature] = serialized.split('.');
  if (!encodedPayload || !receivedSignature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const receivedBuffer = Buffer.from(receivedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(decode(encodedPayload)) as T;
    const expiresAt = new Date(parsed.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function createSessionPayload(input: { email: string; customerId?: string | null }): AppSessionPayload {
  return {
    sessionId: randomUUID(),
    customerId: input.customerId || '',
    email: input.email.trim().toLowerCase(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
}

export function serializeSession(payload: AppSessionPayload) {
  return serializeSignedPayload(payload);
}

export function parseSession(serialized: string | undefined | null): AppSessionPayload | null {
  const parsed = parseSignedPayload<AppSessionPayload>(serialized);
  if (!parsed || !parsed.sessionId || !parsed.email) {
    return null;
  }

  return {
    sessionId: parsed.sessionId,
    customerId: parsed.customerId || '',
    email: parsed.email.toLowerCase(),
    expiresAt: parsed.expiresAt,
  };
}

export function createEmailLinkChallenge(input: { email: string; customerGid: string; code: string }): EmailLinkChallengePayload {
  return {
    email: input.email.trim().toLowerCase(),
    customerGid: input.customerGid,
    code: input.code,
    expiresAt: new Date(Date.now() + LINK_CHALLENGE_TTL_MS).toISOString(),
  };
}

export function serializeEmailLinkChallenge(payload: EmailLinkChallengePayload) {
  return serializeSignedPayload(payload);
}

export function parseEmailLinkChallenge(serialized: string | undefined | null) {
  const parsed = parseSignedPayload<EmailLinkChallengePayload>(serialized);
  if (!parsed || !parsed.email || !parsed.customerGid || !parsed.code) {
    return null;
  }
  return parsed;
}

export function createBookingManageTokenPayload(input: {
  bookingId: string;
  email: string;
  ttlMs?: number;
}): BookingManageTokenPayload {
  const ttlMs =
    typeof input.ttlMs === 'number' && Number.isFinite(input.ttlMs) && input.ttlMs > 0
      ? input.ttlMs
      : BOOKING_MANAGE_TOKEN_TTL_MS;

  return {
    bookingId: input.bookingId,
    email: input.email.trim().toLowerCase(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  };
}

export function serializeBookingManageToken(payload: BookingManageTokenPayload) {
  return serializeSignedPayload(payload);
}

export function createBookingManageToken(input: {
  bookingId: string;
  email: string;
  ttlMs?: number;
}) {
  return serializeBookingManageToken(createBookingManageTokenPayload(input));
}

export function parseBookingManageToken(serialized: string | undefined | null) {
  const parsed = parseSignedPayload<BookingManageTokenPayload>(serialized);
  if (!parsed || !parsed.bookingId || !parsed.email) {
    return null;
  }

  return {
    bookingId: parsed.bookingId,
    email: parsed.email.toLowerCase(),
    expiresAt: parsed.expiresAt,
  };
}

export function applySessionCookies(response: NextResponse, payload: AppSessionPayload) {
  const serialized = serializeSession(payload);
  const expires = new Date(payload.expiresAt);
  const secure = process.env.NODE_ENV === 'production';

  response.cookies.set('gjm_session', serialized, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires,
  });

  response.cookies.set('session_id', payload.sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires,
  });

  response.cookies.set('session_customer_id', payload.customerId, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires,
  });

  response.cookies.set('session_email', payload.email, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires,
  });
}

export function clearSessionCookies(response: NextResponse) {
  for (const name of ['gjm_session', 'session_id', 'session_customer_id', 'session_email']) {
    response.cookies.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(0),
    });
  }
}

export function applyEmailLinkChallengeCookie(response: NextResponse, payload: EmailLinkChallengePayload) {
  response.cookies.set('gjm_link_challenge', serializeEmailLinkChallenge(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(payload.expiresAt),
  });
}

export function clearEmailLinkChallengeCookie(response: NextResponse) {
  response.cookies.set('gjm_link_challenge', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
}