import { useEffect, useMemo, useState } from 'react';
import { BOOKING_SERVICE_TYPE_CATALOG_RESPONSE_SCHEMA } from '@/lib/contracts/apiSchemas';
import type { BookingServiceTypeCatalogResponse, ServiceTypeOption } from '@/types/booking';
import {
  FALLBACK_SERVICE_TYPES,
  firstServiceTypeId,
  toServiceTypeMap,
  toServiceTypeSlotMap,
} from '@/lib/booking/serviceTypeCatalogClient';

export function useBookingServiceTypes() {
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>(FALLBACK_SERVICE_TYPES);

  const serviceTypeMap = useMemo(() => toServiceTypeMap(serviceTypes), [serviceTypes]);
  const serviceTypeSlotMap = useMemo(() => toServiceTypeSlotMap(serviceTypes), [serviceTypes]);
  const serviceTypeIds = useMemo(() => serviceTypes.map((serviceType) => serviceType.id), [serviceTypes]);
  const defaultServiceType = useMemo(() => firstServiceTypeId(serviceTypes), [serviceTypes]);

  useEffect(() => {
    let cancelled = false;

    async function loadServiceTypes() {
      try {
        const response = await fetch('/api/bookings/service-types', { cache: 'no-store' });
        const payload = (await response.json()) as BookingServiceTypeCatalogResponse;
        const parsed = BOOKING_SERVICE_TYPE_CATALOG_RESPONSE_SCHEMA.safeParse(payload);
        if (cancelled || !response.ok || !parsed.success || !parsed.data.serviceTypes.length) return;

        setServiceTypes(parsed.data.serviceTypes as ServiceTypeOption[]);
      } catch {
        // Keep fallback service type catalog when API is unavailable.
      }
    }

    loadServiceTypes();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    serviceTypes,
    serviceTypeMap,
    serviceTypeSlotMap,
    serviceTypeIds,
    defaultServiceType,
  };
}
