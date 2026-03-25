import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

type FitProfileApiResponse = {
  id: string;
  label: string;
  customerId?: string;
  email?: string;
  categoryDefaults: {
    jacket?: { size?: string | null };
    trouser?: { size?: string | null };
  };
  fitPreference?: string | null;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
  technicalSpecs?: unknown;
  isActive: boolean;
  updatedAt: string;
};

function mapProfileToApi(profile: {
  id: string;
  profile_name: string | null;
  customerId: string | null;
  email: string;
  jacketSize: string | null;
  trouserSize: string | null;
  fitPreference: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  technicalSpecs: unknown;
  isActive: boolean;
  updatedAt: Date;
}): FitProfileApiResponse {
  return {
    id: profile.id,
    label: profile.profile_name || 'Saved Profile',
    customerId: profile.customerId || undefined,
    email: profile.email,
    categoryDefaults: {
      jacket: { size: profile.jacketSize },
      trouser: { size: profile.trouserSize },
    },
    fitPreference: profile.fitPreference,
    appointmentDate: profile.appointmentDate,
    appointmentTime: profile.appointmentTime,
    technicalSpecs: profile.technicalSpecs,
    isActive: profile.isActive,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let sessionEmail = '';
    let sessionCustomerId = '';

    try {
      const session = await getSessionContext();
      sessionEmail = session.email;
      sessionCustomerId = session.customerId;
    } catch {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const profile = await prisma.fitProfile.findUnique({
      where: { id },
      select: {
        id: true,
        profile_name: true,
        customerId: true,
        email: true,
        jacketSize: true,
        trouserSize: true,
        fitPreference: true,
        appointmentDate: true,
        appointmentTime: true,
        technicalSpecs: true,
        isActive: true,
        updatedAt: true,
      },
    });

    if (!profile || !profile.isActive) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    const ownedByCustomerId = !!profile.customerId && profile.customerId === sessionCustomerId;
    const ownedByEmail = profile.email.toLowerCase() === sessionEmail;

    if (!ownedByCustomerId && !ownedByEmail) {
      return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    return NextResponse.json({ ok: true, profile: mapProfileToApi(profile) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}