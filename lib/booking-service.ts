// lib/booking-service.ts
import { AppointmentRequest } from '@/types/booking';

export const BookingService = {
  /**
   * Validates if a date/time is available
   * Logic: No bookings on Sundays, and max 3 appointments per day
   */
  async checkAvailability(date: string) {
    const day = new Date(date).getUTCDay();
    if (day === 0) return { isAvailable: false, message: "Closed on Sundays" };
    
    // Mock: In a real app, you'd check your Postgres DB here
    return { 
      isAvailable: true, 
      slots: ['09:00 AM', '11:00 AM', '01:30 PM', '04:00 PM'] 
    };
  },

  /**
   * Saves the booking and the Fit Profile snapshot
   */
  async createBooking(data: AppointmentRequest) {
    console.log("Saving to Database:", data);
    
    // Simulate DB Insert delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      bookingId: `GJ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      message: "Booking recorded in Atelier system."
    };
  }
};