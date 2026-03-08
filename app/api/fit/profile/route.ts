import { NextResponse } from 'next/server';
import { FitProfileCreate, FitProfile } from '@/types/fit';

export async function POST(req: Request) {
  const body: FitProfileCreate = await req.json();
  // TODO: create/update in database
  const created: FitProfile = { id: 'fp_sample', label: body.label || '', categoryDefaults: {} };
  return NextResponse.json(created);
}