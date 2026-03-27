import { NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking-service';
import { BOOKING_UPDATE_REQUEST_SCHEMA } from '@/lib/contracts/apiSchemas';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Booking id is required' }, { status: 400 });
    }

    const parsed = BOOKING_UPDATE_REQUEST_SCHEMA.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await BookingService.updateBooking(id, parsed.data);
    return NextResponse.json(
      { success: result.success, message: result.message },
      { status: result.status },
    );
  } catch (error) {
    console.error('Booking PATCH API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update booking' },
      { status: 500 },
    );
  }
}
