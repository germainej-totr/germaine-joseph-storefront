import { NextResponse } from 'next/server';

import { RESCHEDULE_BOOKING_REQUEST_SCHEMA } from '@/lib/contracts/apiSchemas';
import { RescheduleBookingService } from '@/lib/booking/RescheduleBookingService';
import { emitBookingLifecycleEvent } from '@/lib/automation/bookingLifecycleEvents';
import { buildCalendarLinks, formatAppointmentLabel } from '@/lib/booking/calendar';
import { getServiceTypeConfig, isServiceType } from '@/lib/booking/serviceTypes';
import { sendBookingRescheduledEmail } from '@/lib/resend';
import { createBookingManageToken } from '@/lib/session';
import prisma from '@/lib/prisma';
import { hasBookingAccess } from '@/lib/booking/bookingAccess';

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

export async function POST(request: Request) {
  try {
    const parsed = RESCHEDULE_BOOKING_REQUEST_SCHEMA.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', details: parsed.error.flatten() },
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

    const result = await RescheduleBookingService.reschedule(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status },
      );
    }

    const locationAddress = readAddressFromLocation(result.current.location);
    const serviceTypeConfig = isServiceType(result.current.serviceType)
      ? await getServiceTypeConfig(result.current.serviceType).catch(() => null)
      : null;
    const durationMin = serviceTypeConfig?.durationMin ?? 60;

    const links = buildCalendarLinks({
      title: 'Fitting: Germaine Joseph Bespoke',
      location: locationAddress,
      date: result.current.date,
      timeSlot: result.current.timeSlot,
      durationMin,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const manageToken = createBookingManageToken({
      bookingId: result.bookingId,
      email: result.current.email,
    });
    const icsDownloadUrl = `${siteUrl.replace(/\/$/, '')}/api/bookings/ics?bookingId=${encodeURIComponent(result.bookingId)}&manageToken=${encodeURIComponent(manageToken)}`;

    emitBookingLifecycleEvent('booking_rescheduled', {
      bookingId: result.bookingId,
      email: result.current.email,
      serviceType: result.current.serviceType,
      date: result.current.date,
      timeSlot: result.current.timeSlot,
      location: locationAddress,
      source: 'api/bookings/reschedule',
    }).catch((err) => {
      console.error('booking_rescheduled event emit failed:', err);
    });

    sendBookingRescheduledEmail({
      to: result.current.email,
      appointmentLabel: formatAppointmentLabel(result.current.date, result.current.timeSlot),
      appointmentMode: serviceTypeConfig?.label || result.current.serviceType,
      location: locationAddress,
      googleCalendarUrl: links?.googleCalendarUrl,
      outlookCalendarUrl: links?.outlookCalendarUrl,
      icsDownloadUrl,
    }).catch((err) => {
      console.error('booking_rescheduled resend email failed:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Booking rescheduled successfully.',
      bookingId: result.bookingId,
      previous: result.previous,
      current: {
        date: result.current.date,
        timeSlot: result.current.timeSlot,
        serviceType: result.current.serviceType,
        location: locationAddress,
        startAtIso: result.current.startAt.toISOString(),
      },
      calendar: {
        googleCalendarUrl: links?.googleCalendarUrl || null,
        outlookCalendarUrl: links?.outlookCalendarUrl || null,
        icsDownloadUrl,
      },
      manageToken,
    });
  } catch (error) {
    console.error('Reschedule API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reschedule booking.' },
      { status: 500 },
    );
  }
}
