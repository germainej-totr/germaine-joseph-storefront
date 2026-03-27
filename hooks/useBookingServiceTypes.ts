import { useEffect, useMemo, useState } from 'react';
import type { ServiceTypeOption } from '@/types/booking';
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
        const data = (await response.json()) as { serviceTypes?: ServiceTypeOption[] };
        if (cancelled || !response.ok || !data.serviceTypes?.length) return;

        setServiceTypes(data.serviceTypes);
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
