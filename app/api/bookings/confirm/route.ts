// app/api/booking/confirm/route.ts
import { NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Logic: Save the booking and fit profile snapshot to the service
    const result = await BookingService.createBooking(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Booking API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process booking" },
      { status: 500 }
    );
  }
}