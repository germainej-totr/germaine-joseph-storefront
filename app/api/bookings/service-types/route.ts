import { NextResponse } from 'next/server';

import { listServiceTypes } from '@/lib/booking/serviceTypes';

export async function GET() {
  try {
    const serviceTypes = await listServiceTypes();
    return NextResponse.json({ serviceTypes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
