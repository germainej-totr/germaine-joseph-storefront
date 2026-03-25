import { NextResponse } from 'next/server';
import { AvailabilityResponse, ServiceTypeId } from '@/types/booking';
import { BookingService } from '@/lib/booking-service';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { date?: string; serviceType?: ServiceTypeId };
    if (!body.date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const result = await BookingService.checkAvailability(body.date, body.serviceType || 'showroom');
    const payload: AvailabilityResponse = {
      date: body.date,
      availableSlots: result.slots,
      isAvailable: result.isAvailable,
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}