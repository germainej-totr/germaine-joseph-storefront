// types/booking.ts

// Add 'export' here so other files can see this type
export type ServiceTypeId = 'home_office' | 'showroom' | 'virtual';

export interface AppointmentRequest {
  serviceType: ServiceTypeId;
  location: string;
  date: string;
  timeSlot: string;
  customerName?: string;
  customerEmail?: string;
  notes?: string;
  lat?: number;
  lng?: number;
}

export interface AvailabilityResponse {
  date: string;
  availableSlots: string[];
  isAvailable: boolean;
}