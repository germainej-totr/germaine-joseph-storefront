import { NextResponse } from 'next/server';
import { BookingCreate, BookingRecord } from '@/types/booking';
import prisma from '@/lib/prisma';

function getLeadTimeHours(serviceType: string): number {
  if (serviceType === 'home_office') return 48;
  if (serviceType === 'virtual' || serviceType === 'video_consult') return 2;
  return 24;
}

export async function POST(req: Request) {
  try {
    const body: BookingCreate = await req.json();

    if (!body.email || !body.serviceType || !body.startAt || !body.location?.address) {
      return NextResponse.json({ error: 'email, serviceType, startAt, and location.address are required' }, { status: 400 });
    }

    const startAt = new Date(body.startAt);
    if (Number.isNaN(startAt.getTime())) {
      return NextResponse.json({ error: 'startAt must be a valid ISO date-time' }, { status: 400 });
    }

    const leadTimeHours = getLeadTimeHours(body.serviceType);
    const minimumStart = Date.now() + leadTimeHours * 60 * 60 * 1000;
    if (startAt.getTime() < minimumStart) {
      return NextResponse.json(
        { error: `lead_time_violation_${leadTimeHours}h` },
        { status: 400 },
      );
    }

    const conflicting = await prisma.booking.findFirst({
      where: {
        serviceType: body.serviceType,
        startAt,
        status: { not: 'cancelled' },
      },
      select: { id: true },
    });

    if (conflicting) {
      return NextResponse.json({ error: 'slot_conflict' }, { status: 409 });
    }

    const created = await prisma.booking.create({
      data: {
        email: body.email,
        serviceType: body.serviceType,
        startAt,
        location: body.location,
        fitProfileId: body.fitProfileId || null,
        notes: body.notes || null,
        status: 'confirmed',
      },
    });

    const record: BookingRecord = {
      id: created.id,
      serviceType: created.serviceType as BookingCreate['serviceType'],
      startAt: created.startAt.toISOString(),
      location: body.location,
      email: created.email,
      fitProfileId: created.fitProfileId || undefined,
      notes: created.notes || undefined,
      depositAmount: body.depositAmount,
      status: created.status,
      depositStatus: 'none',
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}