import { NextResponse } from 'next/server';

import { FALLBACK_BOOKING_LOCATIONS } from '@/lib/booking/locationCatalogClient';

export async function GET() {
  try {
    return NextResponse.json({ locations: FALLBACK_BOOKING_LOCATIONS });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
