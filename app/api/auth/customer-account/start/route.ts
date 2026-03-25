import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { capturePostHogEvent } from '@/lib/analytics/posthogServer';
import { consumeRateLimit, getRequestClientIp } from '@/lib/security/authHardening';

const OAUTH_STATE_COOKIE = 'gjm_customer_oauth_state';

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
  const authorizeUrl = process.env.SHOPIFY_CUSTOMER_ACCOUNT_AUTHORIZE_URL || '';
  const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || '';
  const scopes = process.env.SHOPIFY_CUSTOMER_ACCOUNT_SCOPES || 'openid email';
  const redirectUri =
    process.env.SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI || `${baseUrl}/api/auth/customer-account/callback`;

  return {
    authorizeUrl,
    clientId,
    scopes,
    redirectUri,
  };
}

export async function GET(request: Request) {
  const clientIp = getRequestClientIp(request);
  const rateLimit = consumeRateLimit(`auth:oauth:start:${clientIp}`, {
    maxRequests: 30,
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

  const config = getOAuthConfig(request);

  if (!config.authorizeUrl || !config.clientId) {
    const payload: Record<string, unknown> = {
      ok: false,
      error: 'customer_account_oauth_not_configured',
    };

    if (process.env.NODE_ENV !== 'production') {
      payload.requiredEnv = [
        'SHOPIFY_CUSTOMER_ACCOUNT_AUTHORIZE_URL',
        'SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID',
        'SHOPIFY_CUSTOMER_ACCOUNT_TOKEN_URL',
      ];
    }

    return NextResponse.json(
      payload,
      { status: 503 },
    );
  }

  const state = randomUUID();

  const authorizeParams = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes,
    state,
  });

  void capturePostHogEvent({
    event: 'gjm_auth_oauth_start',
    distinctId: 'anon:oauth_start',
    properties: {
      source: 'gjm_auth_server',
      method: 'shopify_oauth',
    },
  });

  const redirectUrl = `${config.authorizeUrl}?${authorizeParams.toString()}`;
  const response = NextResponse.redirect(redirectUrl, 302);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });

  return response;
}
