import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createSessionPayload, applySessionCookies } from '@/lib/session';
import { FIT_PROFILE_CREATE_SCHEMA } from '@/lib/fit/FitProfileSchema';
import { FitProfileService } from '@/lib/fit/FitProfileService';

export async function GET() {
  try {
    const profiles = await FitProfileService.listProfilesForCurrentOwner();
    const cookieStore = await cookies();

    return NextResponse.json({
      ok: true,
      profiles,
      defaultFitProfileId: cookieStore.get('fit_profile_id')?.value || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const status = message === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const parsed = FIT_PROFILE_CREATE_SCHEMA.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'invalid_payload', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const profile = await FitProfileService.saveProfile(parsed.data);

    const response = NextResponse.json({ ok: true, profile });
    applySessionCookies(
      response,
      createSessionPayload({
        email: profile.email || parsed.data.email || '',
        customerId: profile.customerId || '',
      }),
    );

    response.cookies.set('fit_profile_id', profile.id, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const status = message === 'forbidden' ? 403 : message === 'email_required' ? 400 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}