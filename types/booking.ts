// types/booking.ts
import type { MtmSpec } from './mtm';

export type ServiceTypeId = 'home_office' | 'showroom' | 'virtual' | 'video_consult' | 'tailor_fitting';

/** Maps app-side ServiceTypeId to the gjm_service_type metaobject handle in Shopify */
export const SERVICE_TYPE_HANDLE: Record<ServiceTypeId, string> = {
  home_office: 'home-office',
  showroom: 'showroom',
  virtual: 'virtual',
  video_consult: 'video-consult',
  tailor_fitting: 'tailor-fitting',
};

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

export interface ServiceTypeOption {
  id: ServiceTypeId;
  handle: string;
  label: string;
  durationMin: number;
  depositAmount: number;
  leadTimeHours: number;
  travelRequired: boolean;
  slots?: string[];
  zones?: { radius_km?: number; flat_fee?: number };
}

export interface BookingCreate {
  serviceType: ServiceTypeId;
  startAt: string;
  endAt?: string;
  location: {
    address: string;
    lat?: number;
    lng?: number;
  };
  email: string;
  fitProfileId?: string;
  notes?: string;
  depositAmount?: number;
}

export interface BookingRecord extends BookingCreate {
  id: string;
  status: string;
  depositStatus: 'none' | 'pending' | 'paid' | 'refunded';
  createdAt: string;
}

export interface BookingUpdateRequest {
  action: 'cancel' | 'reschedule' | 'update';
  serviceType?: ServiceTypeId;
  location?: string;
  date?: string;
  timeSlot?: string;
  notes?: string;
  lat?: number;
  lng?: number;
}

export interface CartAddRequest {
  productId?: string;
  variantId?: string;
  quantity: number;
  productFlow?: 'ready_to_wear' | 'configurable_non_tailor' | 'mtm_tailored';
  fitProfileId?: string;
  mtmSpec?: MtmSpec;
  mtmOptions?: Record<string, string>;
  measurements?: Record<string, number>;
  fitGateVersion?: string;
  customAttributes?: Record<string, string>;
}