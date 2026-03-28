// app/api/bookings/route.ts
// NOTE: This route is the canonical booking POST entry point for direct/programmatic callers.
// All booking creation is routed through BookingService.createBooking() to enforce:
//   - FitGate/fit profile requirements for MTM service types
//   - Fit freshness policy (fresh / stale / missing)
//   - Availability capping and lead-time rules
// Do NOT bypass BookingService here.
import { NextResponse } from 'next/server';
import { CONFIRM_REQUEST_SCHEMA } from '@/lib/contracts/apiSchemas';
import { BookingService } from '@/lib/booking-service';
import { AppointmentRequest } from '@/types/booking';
import { sendBookingConfirmationEmail, sendFitRefreshRequiredEmail } from '@/lib/resend';
import { buildCalendarLinks, formatAppointmentLabel } from '@/lib/booking/calendar';
import { getServiceTypeConfig } from '@/lib/booking/serviceTypes';
import { emitBookingLifecycleEvent } from '@/lib/automation/bookingLifecycleEvents';

export async function POST(req: Request) {
  try {
    const parsed = CONFIRM_REQUEST_SCHEMA.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const body: AppointmentRequest = {
      ...parsed.data,
      location: parsed.data.location?.trim() || '',
    };

    const result = await BookingService.createBooking(body);

    if (!result.success) {
      return NextResponse.json({ error: result.message, ...result }, { status: 400 });
    }

    const isPendingFitRefresh = result.bookingStatus === 'pending_fit_refresh';

    if (result.bookingId && body.customerEmail && !isPendingFitRefresh) {
      emitBookingLifecycleEvent('booking_confirmed', {
        bookingId: result.bookingId,
        email: body.customerEmail,
        serviceType: body.serviceType,
        date: body.date,
        timeSlot: body.timeSlot,
        location: body.location,
        source: 'api/bookings',
      }).catch((err) => console.error('booking_confirmed event emit failed:', err));
    }

    if (result.bookingId && body.customerEmail && isPendingFitRefresh) {
      emitBookingLifecycleEvent('booking_fit_refresh_required', {
        bookingId: result.bookingId,
        email: body.customerEmail,
        serviceType: body.serviceType,
        date: body.date,
        timeSlot: body.timeSlot,
        location: body.location,
        source: 'api/bookings:fit-refresh-required',
      }).catch((err) => console.error('booking_fit_refresh_required event emit failed:', err));
    }

    if (body.customerEmail && !isPendingFitRefresh) {
      const policy = await getServiceTypeConfig(body.serviceType).catch(() => null);
      const durationMin = policy?.durationMin ?? 60;
      const links = buildCalendarLinks({
        title: 'Fitting: Germaine Joseph Bespoke',
        location: body.location || 'Maison Showroom',
        date: body.date,
        timeSlot: body.timeSlot,
        durationMin,
      });
      if (links) {
        sendBookingConfirmationEmail({
          to: body.customerEmail,
          appointmentLabel: formatAppointmentLabel(body.date, body.timeSlot),
          appointmentMode: policy?.label ?? body.serviceType,
          location: body.location || 'Maison Showroom',
          googleCalendarUrl: links.googleCalendarUrl,
          outlookCalendarUrl: links.outlookCalendarUrl,
        }).catch((err) => console.error('Booking email send failed:', err));
      }
    }

    if (body.customerEmail && isPendingFitRefresh) {
      const policy = await getServiceTypeConfig(body.serviceType).catch(() => null);
      sendFitRefreshRequiredEmail({
        to: body.customerEmail,
        appointmentLabel: formatAppointmentLabel(body.date, body.timeSlot),
        appointmentMode: policy?.label ?? body.serviceType,
        location: body.location || 'Maison Showroom',
        fitRefreshUrl:
          result.fitRefreshUrl ||
          `/configure-fit?email=${encodeURIComponent(body.customerEmail)}&source=fit-booking-refresh&serviceType=${encodeURIComponent(body.serviceType)}&date=${encodeURIComponent(body.date)}&timeSlot=${encodeURIComponent(body.timeSlot)}${body.location ? `&location=${encodeURIComponent(body.location)}` : ''}`,
      }).catch((err) => console.error('Fit refresh email send failed:', err));
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}