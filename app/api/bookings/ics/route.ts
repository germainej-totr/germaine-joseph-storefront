import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { buildIcsEventContent } from '@/lib/booking/calendar';
import { getServiceTypeConfig, isServiceType } from '@/lib/booking/serviceTypes';

function toDateAndTimeSlot(startAt: Date): { date: string; timeSlot: string } {
  const date = startAt.toISOString().slice(0, 10);
  const hours = startAt.getUTCHours();
  const minutes = String(startAt.getUTCMinutes()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return { date, timeSlot: `${hour12}:${minutes} ${meridiem}` };
}

function readAddressFromLocation(location: unknown): string {
  if (typeof location !== 'object' || location === null) {
    return 'Maison Showroom';
  }

  const address = (location as { address?: unknown }).address;
  if (typeof address === 'string' && address.trim()) {
    return address;
  }

  return 'Maison Showroom';
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const bookingId = url.searchParams.get('bookingId') || '';

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        serviceType: true,
        startAt: true,
        location: true,
        status: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const serviceTypeLabel = isServiceType(booking.serviceType)
      ? (await getServiceTypeConfig(booking.serviceType)).label
      : booking.serviceType;

    const { date, timeSlot } = toDateAndTimeSlot(booking.startAt);
    const durationMin = isServiceType(booking.serviceType)
      ? (await getServiceTypeConfig(booking.serviceType)).durationMin
      : 60;
    const location = readAddressFromLocation(booking.location);

    const ics = buildIcsEventContent({
      title: 'Fitting: Germaine Joseph Bespoke',
      date,
      timeSlot,
      durationMin,
      location,
      description: `Service: ${serviceTypeLabel}`,
      status: booking.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED',
    });

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="booking-${booking.id}.ics"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Booking ICS API error:', error);
    return NextResponse.json({ error: 'Failed to generate ICS' }, { status: 500 });
  }
}
