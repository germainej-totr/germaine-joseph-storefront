import { NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking-service';
import { BOOKING_UPDATE_REQUEST_SCHEMA } from '@/lib/contracts/apiSchemas';
import prisma from '@/lib/prisma';
import { emitBookingLifecycleEvent } from '@/lib/automation/bookingLifecycleEvents';

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

    const existing = await prisma.booking.findUnique({
      where: { id },
      select: { email: true, serviceType: true, location: true },
    });

    const result = await BookingService.updateBooking(id, parsed.data);

    if (result.success && existing) {
      if (parsed.data.action === 'cancel') {
        emitBookingLifecycleEvent('booking_cancelled', {
          bookingId: id,
          email: existing.email,
          serviceType: existing.serviceType,
          location:
            typeof existing.location === 'object' &&
            existing.location !== null &&
            'address' in (existing.location as Record<string, unknown>) &&
            typeof (existing.location as { address?: unknown }).address === 'string'
              ? ((existing.location as { address?: string }).address ?? '')
              : undefined,
          source: 'api/bookings/[id]:cancel',
        }).catch((err) => {
          console.error('booking_cancelled event emit failed:', err);
        });
      }

      if (parsed.data.action === 'reschedule') {
        emitBookingLifecycleEvent('booking_rescheduled', {
          bookingId: id,
          email: existing.email,
          serviceType: parsed.data.serviceType || existing.serviceType,
          date: parsed.data.date,
          timeSlot: parsed.data.timeSlot,
          location:
            parsed.data.location ||
            (typeof existing.location === 'object' &&
            existing.location !== null &&
            'address' in (existing.location as Record<string, unknown>) &&
            typeof (existing.location as { address?: unknown }).address === 'string'
              ? ((existing.location as { address?: string }).address ?? '')
              : undefined),
          source: 'api/bookings/[id]:reschedule',
        }).catch((err) => {
          console.error('booking_rescheduled event emit failed:', err);
        });
      }
    }

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
