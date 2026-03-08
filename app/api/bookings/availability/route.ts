import { NextResponse } from 'next/server';
import { AvailabilityRequest, AvailabilityResponse } from '@/types/booking';

export async function POST(req: Request) {
  const body: AvailabilityRequest = await req.json();
  // TODO: call booking service logic
  const sample: AvailabilityResponse = { date: body.date, availableSlots: [], isAvailable: false };
  return NextResponse.json(sample);
}