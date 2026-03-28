import prisma from '@/lib/prisma';
import { BookingService } from '@/lib/booking-service';
import { isServiceType } from '@/lib/booking/serviceTypes';
import type { ServiceTypeId } from '@/types/booking';

type RescheduleAvailabilityInput = {
  bookingId: string;
  date: string;
  serviceType?: ServiceTypeId;
};

type RescheduleBookingInput = {
  bookingId: string;
  date: string;
  timeSlot: string;
  serviceType?: ServiceTypeId;
  location?: string;
  lat?: number;
  lng?: number;
};

function toDateAndTimeSlot(startAt: Date): { date: string; timeSlot: string } {
  const date = startAt.toISOString().slice(0, 10);
  const hours = startAt.getUTCHours();
  const minutes = String(startAt.getUTCMinutes()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return { date, timeSlot: `${hour12}:${minutes} ${meridiem}` };
}

export const RescheduleBookingService = {
  async getRescheduleAvailability(input: RescheduleAvailabilityInput): Promise<
    | {
        ok: true;
        bookingId: string;
        date: string;
        serviceType: ServiceTypeId;
        slots: string[];
        message: string;
      }
    | { ok: false; status: number; message: string }
  > {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        serviceType: true,
      },
    });

    if (!booking) {
      return { ok: false, status: 404, message: 'Booking not found.' };
    }

    const effectiveServiceType = input.serviceType || booking.serviceType;
    if (!isServiceType(effectiveServiceType)) {
      return { ok: false, status: 400, message: 'Invalid service type.' };
    }

    const availability = await BookingService.checkAvailabilityForReschedule(
      input.date,
      effectiveServiceType,
      input.bookingId,
    );

    return {
      ok: true,
      bookingId: input.bookingId,
      date: input.date,
      serviceType: effectiveServiceType,
      slots: availability.slots,
      message: availability.message,
    };
  },

  async reschedule(input: RescheduleBookingInput): Promise<
    | {
        ok: true;
        bookingId: string;
        previous: { date: string; timeSlot: string; serviceType: string };
        current: {
          date: string;
          timeSlot: string;
          serviceType: string;
          location: unknown;
          startAt: Date;
          email: string;
        };
      }
    | { ok: false; status: number; message: string }
  > {
    const existing = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        email: true,
        serviceType: true,
        location: true,
        startAt: true,
      },
    });

    if (!existing) {
      return { ok: false, status: 404, message: 'Booking not found.' };
    }

    const previous = toDateAndTimeSlot(existing.startAt);

    const result = await BookingService.updateBooking(input.bookingId, {
      action: 'reschedule',
      serviceType: input.serviceType,
      date: input.date,
      timeSlot: input.timeSlot,
      location: input.location,
      lat: input.lat,
      lng: input.lng,
    });

    if (!result.success) {
      return { ok: false, status: result.status, message: result.message };
    }

    const updated = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        email: true,
        serviceType: true,
        location: true,
        startAt: true,
      },
    });

    if (!updated) {
      return { ok: false, status: 500, message: 'Booking updated but could not be reloaded.' };
    }

    const current = toDateAndTimeSlot(updated.startAt);

    return {
      ok: true,
      bookingId: updated.id,
      previous: {
        ...previous,
        serviceType: existing.serviceType,
      },
      current: {
        ...current,
        serviceType: updated.serviceType,
        location: updated.location,
        startAt: updated.startAt,
        email: updated.email,
      },
    };
  },
};
