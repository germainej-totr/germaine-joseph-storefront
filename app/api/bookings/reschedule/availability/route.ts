import { NextResponse } from 'next/server';

import { RESCHEDULE_AVAILABILITY_QUERY_SCHEMA } from '@/lib/contracts/apiSchemas';
import { RescheduleBookingService } from '@/lib/booking/RescheduleBookingService';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = RESCHEDULE_AVAILABILITY_QUERY_SCHEMA.safeParse({
      bookingId: url.searchParams.get('bookingId') || '',
      date: url.searchParams.get('date') || '',
      serviceType: url.searchParams.get('serviceType') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid query params', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await RescheduleBookingService.getRescheduleAvailability(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({
      success: true,
      bookingId: result.bookingId,
      date: result.date,
      serviceType: result.serviceType,
      availableSlots: result.slots,
      message: result.message,
    });
  } catch (error) {
    console.error('Reschedule availability API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load reschedule availability.' },
      { status: 500 },
    );
  }
}
