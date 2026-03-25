import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import {
  applySessionCookies,
  clearEmailLinkChallengeCookie,
  createSessionPayload,
  parseEmailLinkChallenge,
} from '@/lib/session';
import { cookies } from 'next/headers';
import { consumeRateLimit, getRequestClientIp } from '@/lib/security/authHardening';

const BODY_SCHEMA = z.object({
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const clientIp = getRequestClientIp(request);
  const rateLimit = consumeRateLimit(`auth:link:verify:${clientIp}`, {
    maxRequests: 20,
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

  try {
    const body = BODY_SCHEMA.parse(await request.json());
    const cookieStore = await cookies();
    const challenge = parseEmailLinkChallenge(cookieStore.get('gjm_link_challenge')?.value);

    if (!challenge) {
      return NextResponse.json({ ok: false, error: 'challenge_missing' }, { status: 401 });
    }

    if (challenge.code !== body.code) {
      return NextResponse.json({ ok: false, error: 'invalid_code' }, { status: 401 });
    }

    const customer = await prisma.customer.upsert({
      where: { email: challenge.email },
      update: { shopifyId: challenge.customerGid },
      create: {
        email: challenge.email,
        shopifyId: challenge.customerGid,
      },
    });

    await prisma.fitProfile.updateMany({
      where: { email: challenge.email },
      data: { customerId: customer.id },
    });

    const response = NextResponse.json({ ok: true, customerId: customer.id, email: challenge.email });
    clearEmailLinkChallengeCookie(response);
    applySessionCookies(
      response,
      createSessionPayload({
        email: challenge.email,
        customerId: customer.id,
      }),
    );

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
    }

    console.error('[auth-link-verify] unexpected error', error);
    return NextResponse.json({ ok: false, error: 'auth_link_verify_failed' }, { status: 500 });
  }
}