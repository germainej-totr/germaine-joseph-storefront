import { NextResponse } from 'next/server';
import { CartAddRequest } from '@/types/booking';

export async function POST(req: Request) {
  const body: CartAddRequest = await req.json();
  // TODO: forward add-to-cart request to Shopify client and include MTM props
  return NextResponse.json({ success: true });
}