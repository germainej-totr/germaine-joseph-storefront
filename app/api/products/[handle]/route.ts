import { NextRequest, NextResponse } from 'next/server';
import { ProductDetail } from '@/types/fit';
import { getProductByHandle } from '@/lib/shopify/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  return NextResponse.json({ product });
}