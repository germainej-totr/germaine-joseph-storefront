// lib/booking-service.ts
import { AppointmentRequest, ServiceTypeId } from '@/types/booking';
import prisma from '@/lib/prisma';

type ServicePolicy = {
  slots: string[];
  maxBookingsPerDay: number;
  leadTimeHours: number;
};

const SERVICE_POLICIES: Record<ServiceTypeId, ServicePolicy> = {
  showroom: {
    slots: ['09:00 AM', '11:00 AM', '01:30 PM', '04:00 PM'],
    maxBookingsPerDay: 6,
    leadTimeHours: 24,
  },
  home_office: {
    slots: ['10:00 AM', '01:00 PM', '04:00 PM'],
    maxBookingsPerDay: 4,
    leadTimeHours: 48,
  },
  tailor_fitting: {
    slots: ['09:00 AM', '11:00 AM', '01:30 PM', '04:00 PM'],
    maxBookingsPerDay: 6,
    leadTimeHours: 24,
  },
  virtual: {
    slots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'],
    maxBookingsPerDay: 10,
    leadTimeHours: 2,
  },
  video_consult: {
    slots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'],
    maxBookingsPerDay: 10,
    leadTimeHours: 2,
  },
};

function getServicePolicy(serviceType: ServiceTypeId): ServicePolicy {
  return SERVICE_POLICIES[serviceType];
}

function isServiceType(value: string): value is ServiceTypeId {
  return Object.prototype.hasOwnProperty.call(SERVICE_POLICIES, value);
}

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

    const policy = getServicePolicy(serviceType);

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
      select: { startAt: true, status: true },
    });

    const activeBookings = bookings.filter((booking) => booking.status !== 'cancelled');
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

    if (data.serviceType === 'home_office' && !data.location?.trim()) {
      return {
        success: false,
        message: 'Address is required for home/office fittings.',
      };
    }

    const policy = getServicePolicy(data.serviceType);
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
  }
};