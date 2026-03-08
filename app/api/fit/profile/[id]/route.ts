import { NextResponse } from 'next/server';
import { FitProfile } from '@/types/fit';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // TODO: fetch profile from DB
  const profile: FitProfile = { id, label: 'Sample', categoryDefaults: {} };
  return NextResponse.json(profile);
}