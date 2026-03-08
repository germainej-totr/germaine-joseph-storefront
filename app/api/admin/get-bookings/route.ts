import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    // Fetch all profiles, ordered by most recent
    const bookings = await prisma.fitProfile.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Success: Return the list (or empty array)
    return NextResponse.json(bookings || [], { status: 200 });
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