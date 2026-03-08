import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { FitProfileCreate, FitProfile } from '@/types/fit';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    console.log('[/api/fit/profile] Received request');
    const rawBody = await req.text();
    console.log('[/api/fit/profile] Raw request body:', rawBody);

    if (!rawBody) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    const body: FitProfileCreate = JSON.parse(rawBody);
    console.log('[/api/fit/profile] Parsed request body:', body);

    // Check if a profile already exists for this email
    const existingProfile = await prisma.fitProfile.findUnique({
      where: { email: body.email }
    });

    let profile;
    if (existingProfile) {
      // Update existing profile
      console.log('[/api/fit/profile] Updating existing profile:', existingProfile.id);
      profile = await prisma.fitProfile.update({
        where: { email: body.email },
        data: {
          profile_name: body.label || existingProfile.profile_name || 'New Profile',
          jacketSize: body.categoryDefaults?.jacket?.size || existingProfile.jacketSize,
          trouserSize: body.categoryDefaults?.trouser?.size || existingProfile.trouserSize,
        },
      });
    } else {
      // Create new profile
      console.log('[/api/fit/profile] Creating new profile');
      profile = await prisma.fitProfile.create({
        data: {
          email: body.email,
          profile_name: body.label || 'New Profile',
          jacketSize: body.categoryDefaults?.jacket?.size || null,
          trouserSize: body.categoryDefaults?.trouser?.size || null,
        },
      });
    }

    console.log('[/api/fit/profile] Profile result:', profile);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('[/api/fit/profile] Error creating/updating fit profile:', error);
    return NextResponse.json({ error: 'Failed to create/update profile', details: error.message }, { status: 500 });
  }
}