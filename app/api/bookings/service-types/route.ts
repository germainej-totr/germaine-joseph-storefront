import { NextResponse } from 'next/server';

import { listServiceTypes } from '@/lib/booking/serviceTypes';
import type { BookingServiceTypeCatalogResponse } from '@/types/booking';

export async function GET() {
  try {
    const serviceTypes = await listServiceTypes();
    return NextResponse.json({ serviceTypes } satisfies BookingServiceTypeCatalogResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ serviceTypes: [], error: message } satisfies BookingServiceTypeCatalogResponse, { status: 500 });
  }
}
