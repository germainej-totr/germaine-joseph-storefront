// lib/booking-service.ts
import { AppointmentRequest, BookingUpdateRequest, ServiceTypeId } from '@/types/booking';
import { getServiceTypeConfig, isServiceType } from '@/lib/booking/serviceTypes';
import prisma from '@/lib/prisma';

function parseTimeSlot(timeSlot: string): { hours: number; minutes: number } | null {
  const match = timeSlot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
}

function toUtcDayRange(date: string): { start: Date; end: Date } {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function slotToUtcDate(date: string, timeSlot: string): Date | null {
  const parsedTime = parseTimeSlot(timeSlot);
  if (!parsedTime) return null;

  const startAt = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(startAt.getTime())) return null;
  startAt.setUTCHours(parsedTime.hours, parsedTime.minutes, 0, 0);
  return startAt;
}

function meetsLeadTime(startAt: Date, leadTimeHours: number): boolean {
  const minimumStart = Date.now() + leadTimeHours * 60 * 60 * 1000;
  return startAt.getTime() >= minimumStart;
}

async function getAvailabilitySlots(
  date: string,
  serviceType: ServiceTypeId,
  excludeBookingId?: string,
): Promise<{ isAvailable: boolean; slots: string[]; message: string }> {
  const policy = await getServiceTypeConfig(serviceType);

  const range = toUtcDayRange(date);
  if (Number.isNaN(range.start.getTime())) {
    return { isAvailable: false, message: 'Invalid date', slots: [] as string[] };
  }

  const bookings = await prisma.booking.findMany({
    where: {
      serviceType,
      startAt: {
        gte: range.start,
        lt: range.end,
      },
    },
    select: { id: true, startAt: true, status: true },
  });

  const activeBookings = bookings.filter(
    (booking) => booking.status !== 'cancelled' && booking.id !== excludeBookingId,
  );

  if (activeBookings.length >= policy.maxBookingsPerDay) {
    return {
      isAvailable: false,
      message: 'No slots available for this date',
      slots: [] as string[],
    };
  }

  const bookedSlotSet = new Set(
    activeBookings.map((booking) => {
      const hour24 = booking.startAt.getUTCHours();
      const minutes = booking.startAt.getUTCMinutes().toString().padStart(2, '0');
      const meridiem = hour24 >= 12 ? 'PM' : 'AM';
      const hour12 = hour24 % 12 || 12;
      return `${hour12}:${minutes} ${meridiem}`;
    }),
  );

  const slots = policy.slots.filter((slot) => {
    if (bookedSlotSet.has(slot)) return false;

    const slotDate = slotToUtcDate(date, slot);
    if (!slotDate) return false;

    return meetsLeadTime(slotDate, policy.leadTimeHours);
  });

  return {
    isAvailable: slots.length > 0,
    slots,
    message: slots.length ? 'Slots available' : 'No slots available for this date',
  };
}

export const BookingService = {
  /**
   * Validates if a date/time is available
   * Logic: Max 3 appointments per day, remove already-booked slots.
   */
  async checkAvailability(date: string, serviceType: ServiceTypeId = 'showroom') {
    if (!date) return { isAvailable: false, message: 'Date is required', slots: [] as string[] };

    if (!isServiceType(serviceType)) {
      return { isAvailable: false, message: 'Invalid service type', slots: [] as string[] };
    }

    return getAvailabilitySlots(date, serviceType);
  },

  /**
   * Saves the booking and the Fit Profile snapshot
   */
  async createBooking(data: AppointmentRequest) {
    if (!data.customerEmail) {
      return {
        success: false,
        message: 'Customer email is required.',
      };
    }

    if (!data.date || !data.timeSlot) {
      return {
        success: false,
        message: 'Date and time slot are required.',
      };
    }

    if (!isServiceType(data.serviceType)) {
      return {
        success: false,
        message: 'Invalid service type.',
      };
    }

    const policy = await getServiceTypeConfig(data.serviceType);
    if (policy.travelRequired && !data.location?.trim()) {
      return {
        success: false,
        message: 'Address is required for travel-based fittings.',
      };
    }

    if (!policy.slots.includes(data.timeSlot)) {
      return {
        success: false,
        message: 'Selected time slot is not valid for this service.',
      };
    }

    const parsedTime = parseTimeSlot(data.timeSlot);
    if (!parsedTime) {
      return {
        success: false,
        message: 'Invalid time slot format.',
      };
    }

    const availability = await this.checkAvailability(data.date, data.serviceType);
    if (!availability.isAvailable || !availability.slots.includes(data.timeSlot)) {
      return {
        success: false,
        message: 'Selected time slot is no longer available.',
      };
    }

    const startAt = new Date(`${data.date}T00:00:00.000Z`);
    startAt.setUTCHours(parsedTime.hours, parsedTime.minutes, 0, 0);

    if (!meetsLeadTime(startAt, policy.leadTimeHours)) {
      return {
        success: false,
        message: `Bookings for ${data.serviceType.replace(/_/g, ' ')} require at least ${policy.leadTimeHours} hours notice.`,
      };
    }

    const booking = await prisma.booking.create({
      data: {
        email: data.customerEmail,
        serviceType: data.serviceType,
        startAt,
        location: {
          address: data.location,
          lat: data.lat,
          lng: data.lng,
        },
        notes: data.notes || null,
        status: 'confirmed',
      },
      select: { id: true },
    });

    return {
      success: true,
      bookingId: booking.id,
      message: 'Booking recorded in Atelier system.',
    };
  },

  async updateBooking(bookingId: string, data: BookingUpdateRequest) {
    const existing = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, serviceType: true, status: true, location: true },
    });

    if (!existing) {
      return { success: false, status: 404 as const, message: 'Booking not found.' };
    }

    if (data.action === 'cancel') {
      if (existing.status === 'cancelled') {
        return { success: true, status: 200 as const, message: 'Booking already cancelled.' };
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'cancelled' },
      });

      return { success: true, status: 200 as const, message: 'Booking cancelled successfully.' };
    }

    const nextData: {
      status?: string;
      notes?: string | null;
      location?: { address: string; lat?: number; lng?: number };
      startAt?: Date;
      serviceType?: string;
    } = {};

    if (data.notes !== undefined) {
      nextData.notes = data.notes.trim() || null;
    }

    if (data.location !== undefined) {
      nextData.location = {
        address: data.location.trim(),
        lat: data.lat,
        lng: data.lng,
      };
    }

    if (data.action === 'reschedule') {
      if (!data.date || !data.timeSlot) {
        return {
          success: false,
          status: 400 as const,
          message: 'date and timeSlot are required for reschedule.',
        };
      }

      const nextServiceType = data.serviceType || existing.serviceType;
      if (!isServiceType(nextServiceType)) {
        return { success: false, status: 400 as const, message: 'Invalid service type.' };
      }

      const policy = await getServiceTypeConfig(nextServiceType);
      if (!policy.slots.includes(data.timeSlot)) {
        return {
          success: false,
          status: 400 as const,
          message: 'Selected time slot is not valid for this service.',
        };
      }

      const parsedTime = parseTimeSlot(data.timeSlot);
      if (!parsedTime) {
        return { success: false, status: 400 as const, message: 'Invalid time slot format.' };
      }

      const startAt = new Date(`${data.date}T00:00:00.000Z`);
      startAt.setUTCHours(parsedTime.hours, parsedTime.minutes, 0, 0);
      if (!meetsLeadTime(startAt, policy.leadTimeHours)) {
        return {
          success: false,
          status: 400 as const,
          message: `Bookings for ${nextServiceType.replace(/_/g, ' ')} require at least ${policy.leadTimeHours} hours notice.`,
        };
      }

      const availability = await getAvailabilitySlots(data.date, nextServiceType, bookingId);
      if (!availability.slots.includes(data.timeSlot)) {
        return {
          success: false,
          status: 400 as const,
          message: 'Selected time slot is no longer available.',
        };
      }

      nextData.startAt = startAt;
      nextData.serviceType = nextServiceType;
      nextData.status = 'confirmed';
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: nextData,
    });

    return { success: true, status: 200 as const, message: 'Booking updated successfully.' };
  }
};