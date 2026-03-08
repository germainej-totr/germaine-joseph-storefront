// app/api/measurements/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, category, measurements, source } = body;

    // 1. Technical Check: Ensure required data exists
    if (!email || !measurements) {
      return NextResponse.json({ error: "Missing required tailoring data" }, { status: 400 });
    }

    // 2. Transaction: Find/Create Profile and Save Measurements in one go
    const result = await prisma.$transaction(async (tx) => {
      // Upsert the Profile (Connects the identity)
      const profile = await tx.fitProfile.upsert({
        where: { email: email },
        update: { isActive: true },
        create: { 
          email: email,
          profile_name: `${email.split('@')[0]}'s ${category} Profile`
        }
      });

      // Create the new Measurement snapshot
      const newEntry = await tx.fitMeasurement.create({
        data: {
          fitProfileId: profile.id,
          category: category || 'general',
          data: measurements, // This saves as JSONB in Postgres
          source: source || 'web_form',
          version: 1 // In a full build, we could increment this based on previous count
        }
      });

      return { profile, newEntry };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });

  } catch (error: any) {
    console.error("Tailor Engine API Error:", error);
    return NextResponse.json({ error: "Internal Database Error" }, { status: 500 });
  }
}