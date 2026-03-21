import { NextResponse } from 'next/server';
import { AvailabilityResponse } from '@/types/booking';

export async function POST(req: Request) {
  const body = (await req.json()) as { date: string };
  // TODO: call booking service logic
  const sample: AvailabilityResponse = { date: body.date, availableSlots: [], isAvailable: false };
  return NextResponse.json(sample);
}