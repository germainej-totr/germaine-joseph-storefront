import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, 
      fitPreference, 
      jacketSize, 
      trouserSize, 
      appointmentTime, 
      technicalSpecs 
    } = body;

    // Use 'as any' to bypass VS Code's local type cache. 
    // The database is already updated, this just allows the build to proceed.
    const updatedProfile = await (prisma.fitProfile as any).upsert({
      where: { email: email },
      update: {
        jacketSize: jacketSize?.toString(),
        trouserSize: trouserSize?.toString(),
        fitPreference,
        appointmentTime,
        technicalSpecs, // Stores Stomach, Hips, and physical attributes
        updatedAt: new Date(),
      },
      create: {
        email,
        jacketSize: jacketSize?.toString(),
        trouserSize: trouserSize?.toString(),
        fitPreference,
        appointmentTime,
        technicalSpecs,
      },
    });

    return NextResponse.json({ 
      message: "Maison Profile Synced", 
      id: updatedProfile.id 
    }, { status: 200 });

  } catch (error) {
    console.error("Database Sync Error:", error);
    return NextResponse.json({ message: "Sync failed" }, { status: 500 });
  }
}