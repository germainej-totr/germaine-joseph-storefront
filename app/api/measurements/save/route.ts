import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, configId, block, data } = await req.json();

    // 1. Find or Create the Master Profile
    const profile = await prisma.fitProfile.upsert({
      where: { email },
      update: {},
      create: { 
        email, 
        profile_name: `${email}'s Master Profile`,
        isActive: true 
      }
    });

    // 2. Create the Versioned Fitting Record
    // This stores exactly WHICH production house and block were used
    const newFitting = await prisma.fitMeasurement.create({
      data: {
        fitProfileId: profile.id,
        category: configId, // e.g., 'black_label_male'
        source: 'Tailor Admin Portal',
        version: 1, // We could increment this later for history
        data: {
          blockUsed: block,
          measurements: data,
          timestamp: new Date().toISOString()
        }
      }
    });

    // 3. Update the Master Profile with the latest timestamp for the 6-month rule
    await prisma.fitProfile.update({
      where: { id: profile.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ success: true, record: newFitting });
  } catch (error: any) {
    console.error('Vault Save Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}