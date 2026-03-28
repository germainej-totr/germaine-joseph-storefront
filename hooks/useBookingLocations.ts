import { useEffect, useMemo, useState } from 'react';
import type { BookingLocationOption } from '@/types/booking';
import {
  FALLBACK_BOOKING_LOCATIONS,
  firstEnabledBookingLocationId,
  listEnabledBookingLocations,
  toBookingLocationMap,
} from '@/lib/booking/locationCatalogClient';

export function useBookingLocations() {
  const [locations, setLocations] = useState<BookingLocationOption[]>(FALLBACK_BOOKING_LOCATIONS);

  const locationMap = useMemo(() => toBookingLocationMap(locations), [locations]);
  const enabledLocations = useMemo(() => listEnabledBookingLocations(locations), [locations]);
  const defaultLocationId = useMemo(() => firstEnabledBookingLocationId(locations), [locations]);

  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      try {
        const response = await fetch('/api/bookings/locations', { cache: 'no-store' });
        const data = (await response.json()) as { locations?: BookingLocationOption[] };
        if (cancelled || !response.ok || !data.locations?.length) return;

        setLocations(data.locations);
      } catch {
        // Keep fallback location catalog when API is unavailable.
      }
    }

    loadLocations();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    locations,
    enabledLocations,
    locationMap,
    defaultLocationId,
  };
}
