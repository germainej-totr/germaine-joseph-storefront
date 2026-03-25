// app/api/booking/confirm/route.ts
import { NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking-service';
import { AppointmentRequest } from '@/types/booking';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AppointmentRequest;

    if (!body.customerEmail || !body.date || !body.timeSlot || !body.serviceType) {
      return NextResponse.json(
        { success: false, message: 'customerEmail, date, timeSlot, and serviceType are required' },
        { status: 400 },
      );
    }

    // Logic: Save the booking and fit profile snapshot to the service
    const result = await BookingService.createBooking(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Booking API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process booking' },
      { status: 500 }
    );
  }
}