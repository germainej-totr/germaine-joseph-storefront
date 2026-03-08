import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { FitProfileCreate, FitProfile } from '@/types/fit';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body: FitProfileCreate = await req.json();
    const created = await prisma.fitProfile.create({
      data: {
        email: body.email,
        label: body.label || 'New Profile',
        categoryDefaults: body.categoryDefaults || {},
      },
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error('Error creating fit profile:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}