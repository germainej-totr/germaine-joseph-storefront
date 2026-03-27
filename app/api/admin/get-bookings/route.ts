import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    // Fetch bookings with optional fit profile details for admin intake screens.
    const bookings = await prisma.booking.findMany({
      orderBy: {
        startAt: 'desc',
      },
      include: {
        fitProfile: true,
      },
    });

    const payload = bookings.map((booking) => {
      const fitProfile = booking.fitProfile;
      const startAt = new Date(booking.startAt);

      return {
        id: booking.id,
        email: booking.email,
        status: booking.status,
        serviceType: booking.serviceType,
        appointmentDate: Number.isNaN(startAt.getTime()) ? undefined : startAt.toISOString().slice(0, 10),
        appointmentTime: Number.isNaN(startAt.getTime())
          ? undefined
          : startAt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
        fitPreference: fitProfile?.fitPreference ?? undefined,
        jacketSize: fitProfile?.jacketSize ?? undefined,
        trouserSize: fitProfile?.trouserSize ?? undefined,
        technicalSpecs:
          fitProfile?.technicalSpecs && typeof fitProfile.technicalSpecs === 'object'
            ? fitProfile.technicalSpecs
            : undefined,
      };
    });

    // Success: Return the list (or empty array)
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Database Fetch Error:", error);
    
    // Error: Return specific diagnostic message
    return NextResponse.json(
      { 
        message: "Failed to load bookings from germaine-joseph-db",
        error: error instanceof Error ? error.message : "Unknown database error"
      }, 
      { status: 500 }
    );
  }
}