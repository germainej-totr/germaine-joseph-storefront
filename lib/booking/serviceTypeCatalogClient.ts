import type { ServiceTypeOption } from '@/types/booking';

export const FALLBACK_SERVICE_TYPES: ServiceTypeOption[] = [
  { id: 'showroom', handle: 'showroom', label: 'Showroom Fitting', durationMin: 60, depositAmount: 50, leadTimeHours: 24, travelRequired: false, slots: ['09:00 AM', '11:00 AM', '01:30 PM', '04:00 PM'], zones: {} },
  { id: 'home_office', handle: 'home-office', label: 'Home / Office Visit', durationMin: 90, depositAmount: 50, leadTimeHours: 48, travelRequired: true, slots: ['10:00 AM', '01:00 PM', '04:00 PM'], zones: { radius_km: 30, flat_fee: 0 } },
  { id: 'tailor_fitting', handle: 'tailor-fitting', label: 'Tailor Fitting Session', durationMin: 120, depositAmount: 75, leadTimeHours: 48, travelRequired: true, slots: ['09:00 AM', '11:00 AM', '01:30 PM', '04:00 PM'], zones: { radius_km: 30, flat_fee: 25 } },
  { id: 'virtual', handle: 'virtual', label: 'Virtual Consultation', durationMin: 30, depositAmount: 0, leadTimeHours: 24, travelRequired: false, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'], zones: {} },
  { id: 'video_consult', handle: 'video-consult', label: 'Video Consultation', durationMin: 45, depositAmount: 0, leadTimeHours: 24, travelRequired: false, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'], zones: {} },
];

export function toServiceTypeMap(serviceTypes: ServiceTypeOption[]): Record<string, ServiceTypeOption> {
  return serviceTypes.reduce<Record<string, ServiceTypeOption>>((accumulator, serviceType) => {
    accumulator[serviceType.id] = serviceType;
    return accumulator;
  }, {});
}

export function toServiceTypeSlotMap(serviceTypes: ServiceTypeOption[]): Record<string, string[]> {
  return serviceTypes.reduce<Record<string, string[]>>((accumulator, serviceType) => {
    if (serviceType.slots?.length) {
      accumulator[serviceType.id] = serviceType.slots;
    }
    return accumulator;
  }, {});
}

export function firstServiceTypeId(serviceTypes: ServiceTypeOption[]): string {
  return serviceTypes[0]?.id || 'showroom';
}
