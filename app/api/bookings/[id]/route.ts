import { NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking-service';
import { BOOKING_UPDATE_REQUEST_SCHEMA } from '@/lib/contracts/apiSchemas';
import prisma from '@/lib/prisma';
import { emitBookingLifecycleEvent } from '@/lib/automation/bookingLifecycleEvents';
import { formatAppointmentLabel } from '@/lib/booking/calendar';
import { getServiceTypeConfig, isServiceType } from '@/lib/booking/serviceTypes';
import { sendBookingCancelledEmail, sendBookingRescheduledEmail } from '@/lib/resend';

function readAddressFromLocation(location: unknown): string {
  if (typeof location !== 'object' || location === null) {
    return 'Maison Showroom';
  }

  if (
    'address' in (location as Record<string, unknown>) &&
    typeof (location as { address?: unknown }).address === 'string' &&
    (location as { address?: string }).address?.trim()
  ) {
    return (location as { address: string }).address;
  }

  return 'Maison Showroom';
}

function toDateAndTimeSlot(startAt: Date): { date: string; timeSlot: string } {
  const date = startAt.toISOString().slice(0, 10);
  const hours = startAt.getUTCHours();
  const minutes = String(startAt.getUTCMinutes()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return { date, timeSlot: `${hour12}:${minutes} ${meridiem}` };
}

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
      select: { email: true, serviceType: true, location: true, startAt: true },
    });

    const result = await BookingService.updateBooking(id, parsed.data);

    if (result.success && existing) {
      const locationAddress = readAddressFromLocation(existing.location);

      if (parsed.data.action === 'cancel') {
        emitBookingLifecycleEvent('booking_cancelled', {
          bookingId: id,
          email: existing.email,
          serviceType: existing.serviceType,
          location: locationAddress,
          source: 'api/bookings/[id]:cancel',
        }).catch((err) => {
          console.error('booking_cancelled event emit failed:', err);
        });

        const previous = toDateAndTimeSlot(existing.startAt);
        const serviceTypeConfig = isServiceType(existing.serviceType)
          ? await getServiceTypeConfig(existing.serviceType)
          : null;

        sendBookingCancelledEmail({
          to: existing.email,
          appointmentLabel: formatAppointmentLabel(previous.date, previous.timeSlot),
          appointmentMode: serviceTypeConfig?.label || existing.serviceType,
          location: locationAddress,
        }).catch((err) => {
          console.error('booking_cancelled resend email failed:', err);
        });
      }

      if (parsed.data.action === 'reschedule') {
        emitBookingLifecycleEvent('booking_rescheduled', {
          bookingId: id,
          email: existing.email,
          serviceType: parsed.data.serviceType || existing.serviceType,
          date: parsed.data.date,
          timeSlot: parsed.data.timeSlot,
          location: parsed.data.location || locationAddress,
          source: 'api/bookings/[id]:reschedule',
        }).catch((err) => {
          console.error('booking_rescheduled event emit failed:', err);
        });

        const nextServiceType = parsed.data.serviceType || existing.serviceType;
        const serviceTypeConfig = isServiceType(nextServiceType)
          ? await getServiceTypeConfig(nextServiceType)
          : null;

        if (parsed.data.date && parsed.data.timeSlot) {
          sendBookingRescheduledEmail({
            to: existing.email,
            appointmentLabel: formatAppointmentLabel(parsed.data.date, parsed.data.timeSlot),
            appointmentMode: serviceTypeConfig?.label || nextServiceType,
            location: parsed.data.location || locationAddress,
          }).catch((err) => {
            console.error('booking_rescheduled resend email failed:', err);
          });
        }
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
