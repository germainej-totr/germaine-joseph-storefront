import { NextResponse } from 'next/server';
import { BookingCreate, BookingRecord } from '@/types/booking';

export async function POST(req: Request) {
  const body: BookingCreate = await req.json();
  // TODO: create booking in DB and handle deposit
  const record: BookingRecord = { ...body, id: 'bk_123', status: 'confirmed', depositStatus: 'none', createdAt: new Date().toISOString() };
  return NextResponse.json(record);
}