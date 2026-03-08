import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { FitProfileCreate, FitProfile } from '@/types/fit';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body: FitProfileCreate = await req.json();

    // Check if a profile already exists for this email
    const existingProfile = await prisma.fitProfile.findUnique({
      where: { email: body.email }
    });

    let profile;
    if (existingProfile) {
      // Update existing profile
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
      profile = await prisma.fitProfile.create({
        data: {
          email: body.email,
          profile_name: body.label || 'New Profile',
          jacketSize: body.categoryDefaults?.jacket?.size || null,
          trouserSize: body.categoryDefaults?.trouser?.size || null,
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error creating/updating fit profile:', error);
    return NextResponse.json({ error: 'Failed to create/update profile' }, { status: 500 });
  }
}