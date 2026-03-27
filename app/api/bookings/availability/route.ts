import { NextResponse } from 'next/server';
import { AvailabilityResponse, ServiceTypeId } from '@/types/booking';
import { BookingService } from '@/lib/booking-service';
import { AVAILABILITY_REQUEST_SCHEMA } from '@/lib/contracts/apiSchemas';

export async function POST(req: Request) {
  try {
    const parsed = AVAILABILITY_REQUEST_SCHEMA.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const body = parsed.data as { date: string; serviceType?: ServiceTypeId };
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