import 'server-only';

import { cache } from 'react';

import { mapToGJServiceType, type MetaobjectRaw } from '@/lib/metaobject-mappers';
import { shopifyAdminGraphQL } from '@/lib/shopify';
import { SERVICE_TYPE_HANDLE, type ServiceTypeId, type ServiceTypeOption } from '@/types/booking';

type ServiceTypeDefaults = ServiceTypeOption & {
  slots: string[];
  maxBookingsPerDay: number;
};

const SERVICE_TYPE_DEFAULTS: Record<ServiceTypeId, ServiceTypeDefaults> = {
  showroom: {
    id: 'showroom',
    handle: SERVICE_TYPE_HANDLE.showroom,
    label: 'Showroom Fitting',
    durationMin: 60,
    depositAmount: 50,
    leadTimeHours: 24,
    travelRequired: false,
    zones: {},
    slots: ['09:00 AM', '11:00 AM', '01:30 PM', '04:00 PM'],
    maxBookingsPerDay: 6,
  },
  home_office: {
    id: 'home_office',
    handle: SERVICE_TYPE_HANDLE.home_office,
    label: 'Home / Office Visit',
    durationMin: 90,
    depositAmount: 50,
    leadTimeHours: 48,
    travelRequired: true,
    zones: { radius_km: 30, flat_fee: 0 },
    slots: ['10:00 AM', '01:00 PM', '04:00 PM'],
    maxBookingsPerDay: 4,
  },
  tailor_fitting: {
    id: 'tailor_fitting',
    handle: SERVICE_TYPE_HANDLE.tailor_fitting,
    label: 'Tailor Fitting Session',
    durationMin: 120,
    depositAmount: 75,
    leadTimeHours: 48,
    travelRequired: true,
    zones: { radius_km: 30, flat_fee: 25 },
    slots: ['09:00 AM', '11:00 AM', '01:30 PM', '04:00 PM'],
    maxBookingsPerDay: 6,
  },
  virtual: {
    id: 'virtual',
    handle: SERVICE_TYPE_HANDLE.virtual,
    label: 'Virtual Consultation',
    durationMin: 30,
    depositAmount: 0,
    leadTimeHours: 24,
    travelRequired: false,
    zones: {},
    slots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'],
    maxBookingsPerDay: 10,
  },
  video_consult: {
    id: 'video_consult',
    handle: SERVICE_TYPE_HANDLE.video_consult,
    label: 'Video Consultation',
    durationMin: 45,
    depositAmount: 0,
    leadTimeHours: 24,
    travelRequired: false,
    zones: {},
    slots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'],
    maxBookingsPerDay: 10,
  },
};

const SERVICE_TYPE_ORDER: ServiceTypeId[] = ['showroom', 'home_office', 'virtual', 'video_consult', 'tailor_fitting'];

type ShopifyMetaobjectsResponse = {
  data?: {
    metaobjects?: {
      nodes?: MetaobjectRaw[];
    };
  };
  errors?: Array<{ message?: string }>;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function reverseHandleMap(): Record<string, ServiceTypeId> {
  return Object.entries(SERVICE_TYPE_HANDLE).reduce<Record<string, ServiceTypeId>>((accumulator, [serviceType, handle]) => {
    accumulator[handle] = serviceType as ServiceTypeId;
    return accumulator;
  }, {});
}

function mergeServiceType(defaults: ServiceTypeDefaults, raw?: MetaobjectRaw): ServiceTypeDefaults {
  if (!raw) {
    return defaults;
  }

  const mapped = mapToGJServiceType(raw);

  return {
    ...defaults,
    handle: raw.handle || defaults.handle,
    label: mapped.name || defaults.label,
    durationMin: isFiniteNumber(mapped.durationMin) && mapped.durationMin > 0 ? mapped.durationMin : defaults.durationMin,
    depositAmount: isFiniteNumber(mapped.depositAmount) ? mapped.depositAmount : defaults.depositAmount,
    leadTimeHours: isFiniteNumber(mapped.leadTimeHours) && mapped.leadTimeHours >= 0 ? mapped.leadTimeHours : defaults.leadTimeHours,
    travelRequired: typeof mapped.travelRequired === 'boolean' ? mapped.travelRequired : defaults.travelRequired,
    zones: mapped.zones ?? defaults.zones,
  };
}

async function loadServiceTypeCatalog(): Promise<Record<ServiceTypeId, ServiceTypeDefaults>> {
  const defaults = { ...SERVICE_TYPE_DEFAULTS };

  try {
    const response = (await shopifyAdminGraphQL(
      `
        query BookingServiceTypes($type: String!) {
          metaobjects(type: $type, first: 50) {
            nodes {
              id
              handle
              type
              fields {
                key
                value
              }
            }
          }
        }
      `,
      { type: 'gjm_service_type' },
    )) as ShopifyMetaobjectsResponse;

    if (response.errors?.length) {
      return defaults;
    }

    const byHandle = reverseHandleMap();
    for (const raw of response.data?.metaobjects?.nodes ?? []) {
      const serviceType = byHandle[raw.handle];
      if (!serviceType) {
        continue;
      }

      defaults[serviceType] = mergeServiceType(defaults[serviceType], raw);
    }

    return defaults;
  } catch (error) {
    console.error('Failed to load gjm_service_type metaobjects:', error);
    return defaults;
  }
}

const getCachedServiceTypeCatalog = cache(loadServiceTypeCatalog);

export function isServiceType(value: string): value is ServiceTypeId {
  return Object.prototype.hasOwnProperty.call(SERVICE_TYPE_DEFAULTS, value);
}

export async function getServiceTypeConfig(serviceType: ServiceTypeId): Promise<ServiceTypeDefaults> {
  const catalog = await getCachedServiceTypeCatalog();
  return catalog[serviceType];
}

export async function listServiceTypes(): Promise<ServiceTypeOption[]> {
  const catalog = await getCachedServiceTypeCatalog();
  return SERVICE_TYPE_ORDER.map((serviceType) => {
    const config = catalog[serviceType];
    return {
      id: config.id,
      handle: config.handle,
      label: config.label,
      durationMin: config.durationMin,
      depositAmount: config.depositAmount,
      leadTimeHours: config.leadTimeHours,
      travelRequired: config.travelRequired,
      slots: config.slots,
      zones: config.zones,
    };
  });
}
