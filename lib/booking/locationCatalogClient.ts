import type { BookingLocationOption } from '@/types/booking';

export const FALLBACK_BOOKING_LOCATIONS: BookingLocationOption[] = [
  {
    id: 'melbourne-studio',
    label: 'Melbourne Studio',
    city: 'Melbourne, VIC',
    countryCode: 'AU',
    timeZone: 'Australia/Melbourne',
    address: process.env.NEXT_PUBLIC_MAISON_STUDIO_ADDRESS || 'Melbourne address pending final confirmation',
    enabled: true,
    supportsShowroom: true,
  },
  {
    id: 'nyc-studio',
    label: 'NYC Studio (Coming Soon)',
    city: 'New York, NY',
    countryCode: 'US',
    timeZone: 'America/New_York',
    enabled: false,
    supportsShowroom: true,
  },
];

export function listEnabledBookingLocations(locations: BookingLocationOption[]): BookingLocationOption[] {
  return locations.filter((location) => location.enabled);
}

export function toBookingLocationMap(locations: BookingLocationOption[]): Record<string, BookingLocationOption> {
  return locations.reduce<Record<string, BookingLocationOption>>((accumulator, location) => {
    accumulator[location.id] = location;
    return accumulator;
  }, {});
}

export function firstEnabledBookingLocationId(locations: BookingLocationOption[]): string {
  return listEnabledBookingLocations(locations)[0]?.id || 'melbourne-studio';
}
