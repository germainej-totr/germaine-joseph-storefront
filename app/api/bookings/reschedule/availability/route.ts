import { NextResponse } from 'next/server';

import { RESCHEDULE_AVAILABILITY_QUERY_SCHEMA } from '@/lib/contracts/apiSchemas';
import { RescheduleBookingService } from '@/lib/booking/RescheduleBookingService';
import prisma from '@/lib/prisma';
import { hasBookingAccess } from '@/lib/booking/bookingAccess';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = RESCHEDULE_AVAILABILITY_QUERY_SCHEMA.safeParse({
      bookingId: url.searchParams.get('bookingId') || '',
      date: url.searchParams.get('date') || '',
      serviceType: url.searchParams.get('serviceType') || undefined,
      manageToken: url.searchParams.get('manageToken') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid query params', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const hasTokenSignal = Boolean(parsed.data.manageToken || request.headers.get('x-gjm-manage-token'));
    if (hasTokenSignal) {
      const booking = await prisma.booking.findUnique({
        where: { id: parsed.data.bookingId },
        select: {
          id: true,
          email: true,
          fitProfile: {
            select: {
              customerId: true,
            },
          },
        },
      });

      if (!booking) {
        return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
      }

      const accessAllowed = await hasBookingAccess({
        request,
        bookingId: booking.id,
        bookingEmail: booking.email,
        fitProfileCustomerId: booking.fitProfile?.customerId,
        manageToken: parsed.data.manageToken,
      });

      if (!accessAllowed) {
        return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
      }
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
