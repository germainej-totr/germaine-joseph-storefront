import { NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
import { FitProfileCreate } from '@/types/fit';
import { applySessionCookies, createSessionPayload } from '@/lib/session';

const prisma = new PrismaClient();

type CategoryDefaultsInput = Partial<
  Record<'jacket' | 'trouser', { size?: string | null }>
>;

function toPrismaJson(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}

export async function POST(req: Request) {
  try {
    const body: FitProfileCreate = await req.json();

    const email = body.email?.trim();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const categoryDefaults = (body.categoryDefaults ?? {}) as CategoryDefaultsInput;

    console.log('[POST /api/fit/profile] Received body:', JSON.stringify(body, null, 2));
    console.log('[POST /api/fit/profile] Appointment data:', {
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime,
    });

    const existingProfile = await prisma.fitProfile.findUnique({
      where: { email },
    });

    let profile;
    if (existingProfile) {
      profile = await prisma.fitProfile.update({
        where: { email },
        data: {
          profile_name: body.label || existingProfile.profile_name || 'New Profile',
          jacketSize: categoryDefaults.jacket?.size || existingProfile.jacketSize,
          trouserSize: categoryDefaults.trouser?.size || existingProfile.trouserSize,
          fitPreference: body.fitPreference || existingProfile.fitPreference,
          appointmentDate: body.appointmentDate || existingProfile.appointmentDate,
          appointmentTime: body.appointmentTime || existingProfile.appointmentTime,
          technicalSpecs: toPrismaJson(body.technicalSpecs ?? existingProfile.technicalSpecs),
        },
      });
    } else {
      profile = await prisma.fitProfile.create({
        data: {
          email,
          profile_name: body.label || 'New Profile',
          jacketSize: categoryDefaults.jacket?.size || null,
          trouserSize: categoryDefaults.trouser?.size || null,
          fitPreference: body.fitPreference || null,
          appointmentDate: body.appointmentDate || null,
          appointmentTime: body.appointmentTime || null,
          technicalSpecs: toPrismaJson(body.technicalSpecs),
        },
      });
    }

    const response = NextResponse.json(profile);
    applySessionCookies(
      response,
      createSessionPayload({
        email,
        customerId: existingProfile?.customerId || profile.customerId || '',
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
    console.error('Error creating/updating fit profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create/update profile', details: errorMessage },
      { status: 500 }
    );
  }
}