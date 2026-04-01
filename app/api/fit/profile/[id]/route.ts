import { NextRequest, NextResponse } from 'next/server';

import { FIT_PROFILE_UPDATE_SCHEMA } from '@/lib/fit/FitProfileSchema';
import { FitProfileService } from '@/lib/fit/FitProfileService';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const profile = await FitProfileService.getProfileForCurrentOwner(id);

    if (!profile) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const status = message === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const parsed = FIT_PROFILE_UPDATE_SCHEMA.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'invalid_payload', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const profile = await FitProfileService.updateProfile(id, parsed.data);
    if (!profile) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const status = message === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return PATCH(request, context);
}