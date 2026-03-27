// app/api/booking/confirm/route.ts
import { NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking-service';
import { AppointmentRequest } from '@/types/booking';
import { CONFIRM_REQUEST_SCHEMA } from '@/lib/contracts/apiSchemas';
import { sendBookingConfirmationEmail } from '@/lib/resend';
import { buildCalendarLinks, formatAppointmentLabel } from '@/lib/booking/calendar';
import { getServiceTypeConfig } from '@/lib/booking/serviceTypes';

export async function POST(request: Request) {
  try {
    const parsed = CONFIRM_REQUEST_SCHEMA.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const body: AppointmentRequest = {
      ...parsed.data,
      location: parsed.data.location?.trim() || '',
    };

    // Logic: Save the booking and fit profile snapshot to the service
    const result = await BookingService.createBooking(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Send confirmation email (fire-and-forget — never block the response)
    if (body.customerEmail) {
      const policy = await getServiceTypeConfig(body.serviceType).catch(() => null);
      const durationMin = policy?.durationMin ?? 60;
      const links = buildCalendarLinks({
        title: 'Fitting: Germaine Joseph Bespoke',
        location: body.location || 'Maison Showroom',
        date: body.date,
        timeSlot: body.timeSlot,
        durationMin,
      });
      if (!links) {
        throw new Error('Invalid booking date/time for calendar link generation');
      }

      sendBookingConfirmationEmail({
        to: body.customerEmail,
        appointmentLabel: formatAppointmentLabel(body.date, body.timeSlot),
        appointmentMode: policy?.label ?? body.serviceType,
        location: body.location || 'Maison Showroom',
        googleCalendarUrl: links.googleCalendarUrl,
        outlookCalendarUrl: links.outlookCalendarUrl,
      }).catch((err) => console.error('Booking email send failed:', err));
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