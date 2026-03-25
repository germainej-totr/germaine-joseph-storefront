import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { applySessionCookies, createSessionPayload } from '@/lib/session';
import { capturePostHogEvent } from '@/lib/analytics/posthogServer';
import { consumeRateLimit, getRequestClientIp, TimeoutError, withTimeout } from '@/lib/security/authHardening';

const OAUTH_STATE_COOKIE = 'gjm_customer_oauth_state';

interface TokenResponse {
  access_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

interface CustomerIdentity {
  id: string;
  email: string;
}

function getBaseUrl(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');

  if (forwardedHost) {
    return `${forwardedProto || 'https'}://${forwardedHost}`;
  }

  return url.origin;
}

function getOAuthConfig(request: Request) {
  const baseUrl = process.env.APP_BASE_URL || getBaseUrl(request);
  const tokenUrl = process.env.SHOPIFY_CUSTOMER_ACCOUNT_TOKEN_URL || '';
  const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || '';
  const clientSecret = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET || '';
  const redirectUri =
    process.env.SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI || `${baseUrl}/api/auth/customer-account/callback`;
  const customerApiUrl = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_URL || '';

  return {
    tokenUrl,
    clientId,
    clientSecret,
    redirectUri,
    customerApiUrl,
  };
}

function decodeJwtPayload(token: string) {
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function exchangeCodeForToken(input: {
  tokenUrl: string;
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: input.code,
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
  });

  if (input.clientSecret) {
    body.set('client_secret', input.clientSecret);
  }

  const response = await fetch(input.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store',
  });

  const payload = (await response.json()) as TokenResponse;
  if (!response.ok || payload.error) {
    throw new Error(payload.error_description || payload.error || 'token_exchange_failed');
  }

  if (!payload.access_token && !payload.id_token) {
    throw new Error('token_response_missing_access_or_id_token');
  }

  return payload;
}

async function fetchCustomerIdentity(input: {
  accessToken?: string;
  idToken?: string;
  customerApiUrl?: string;
}): Promise<CustomerIdentity> {
  if (input.accessToken && input.customerApiUrl) {
    const query = `
      query CustomerIdentity {
        customer {
          id
          emailAddress {
            emailAddress
          }
        }
      }
    `;

    const response = await fetch(input.customerApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({ query }),
      cache: 'no-store',
    });

    if (response.ok) {
      const payload = await response.json();
      const customer = payload?.data?.customer;
      const email = customer?.emailAddress?.emailAddress;
      if (customer?.id && email) {
        return {
          id: String(customer.id),
          email: String(email).toLowerCase(),
        };
      }
    }
  }

  if (input.idToken) {
    const claims = decodeJwtPayload(input.idToken);
    const sub = claims?.sub;
    const email = claims?.email;
    if (typeof sub === 'string' && typeof email === 'string') {
      return {
        id: sub,
        email: email.toLowerCase(),
      };
    }
  }

  throw new Error('unable_to_resolve_customer_identity');
}

function clearStateCookie(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}

function toAccountRedirect(request: Request, oauthStatus: string, oauthError?: string) {
  const destination = new URL('/account', getBaseUrl(request));
  destination.searchParams.set('oauth', oauthStatus);
  if (oauthError) {
    destination.searchParams.set('oauth_error', oauthError);
  }
  return destination;
}

function toPublicOAuthError(input: string) {
  const allowedCodes = new Set([
    'token_exchange_failed',
    'token_response_missing_access_or_id_token',
    'unable_to_resolve_customer_identity',
    'shopify_token_exchange_timeout',
    'shopify_identity_lookup_timeout',
  ]);

  if (allowedCodes.has(input)) {
    return input;
  }

  return 'oauth_internal_error';
}

export async function GET(request: Request) {
  const clientIp = getRequestClientIp(request);
  const rateLimit = consumeRateLimit(`auth:oauth:callback:${clientIp}`, {
    maxRequests: 60,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: 'rate_limited',
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  const config = getOAuthConfig(request);

  if (!config.tokenUrl || !config.clientId) {
    return NextResponse.json(
      {
        ok: false,
        error: 'customer_account_oauth_not_configured',
      },
      { status: 503 },
    );
  }

  if (!code || !state) {
    void capturePostHogEvent({
      event: 'gjm_auth_oauth_failure',
      distinctId: 'anon:oauth_callback',
      properties: {
        source: 'gjm_auth_server',
        method: 'shopify_oauth',
        oauth_status: 'missing_code_or_state',
      },
    });
    return NextResponse.redirect(toAccountRedirect(request, 'missing_code_or_state'), 302);
  }

  const requestCookies = request.headers.get('cookie') || '';
  const stateCookie = requestCookies
    .split(';')
    .map((value) => value.trim())
    .find((cookie) => cookie.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.split('=')[1];

  if (!stateCookie || stateCookie !== state) {
    void capturePostHogEvent({
      event: 'gjm_auth_oauth_failure',
      distinctId: 'anon:oauth_callback',
      properties: {
        source: 'gjm_auth_server',
        method: 'shopify_oauth',
        oauth_status: 'state_mismatch',
      },
    });
    return NextResponse.redirect(toAccountRedirect(request, 'state_mismatch'), 302);
  }

  try {
    const token = await withTimeout(
      () =>
        exchangeCodeForToken({
          tokenUrl: config.tokenUrl,
          code,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          redirectUri: config.redirectUri,
        }),
      9000,
      'shopify_token_exchange_timeout',
    );

    const identity = await withTimeout(
      () =>
        fetchCustomerIdentity({
          accessToken: token.access_token,
          idToken: token.id_token,
          customerApiUrl: config.customerApiUrl,
        }),
      9000,
      'shopify_identity_lookup_timeout',
    );

    const customer = await prisma.customer.upsert({
      where: { email: identity.email },
      update: {
        shopifyId: identity.id,
      },
      create: {
        email: identity.email,
        shopifyId: identity.id,
      },
    });

    await prisma.fitProfile.updateMany({
      where: { email: identity.email },
      data: { customerId: customer.id },
    });

    const response = NextResponse.redirect(toAccountRedirect(request, 'linked'), 302);
    void capturePostHogEvent({
      event: 'gjm_auth_oauth_success',
      distinctId: identity.email,
      properties: {
        source: 'gjm_auth_server',
        method: 'shopify_oauth',
        email: identity.email,
      },
    });
    clearStateCookie(response);
    applySessionCookies(
      response,
      createSessionPayload({
        email: identity.email,
        customerId: customer.id,
      }),
    );

    return response;
  } catch (error) {
    const message = error instanceof TimeoutError ? error.code : error instanceof Error ? error.message : 'unknown_oauth_error';
    const publicError = toPublicOAuthError(message);
    void capturePostHogEvent({
      event: 'gjm_auth_oauth_failure',
      distinctId: 'anon:oauth_callback',
      properties: {
        source: 'gjm_auth_server',
        method: 'shopify_oauth',
        oauth_status: 'failed',
        oauth_error: publicError,
      },
    });
    const response = NextResponse.redirect(toAccountRedirect(request, 'failed', publicError), 302);
    clearStateCookie(response);
    console.error('[customer-account-callback] OAuth flow failed:', {
      error: message,
      clientIp,
    });
    return response;
  }
}
