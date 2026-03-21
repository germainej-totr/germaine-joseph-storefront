import { NextRequest, NextResponse } from 'next/server';
import { FitProfile } from '@/types/fit';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: fetch profile from DB
  const profile: FitProfile = {
    id,
    label: 'Sample',
    categoryDefaults: {
      suit: {},
      shirt: {},
      trouser: {},
      overcoat: {},
      blazer: {},
      vest: {},
    },
  };
  return NextResponse.json(profile);
}