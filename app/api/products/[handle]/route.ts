import { NextResponse } from 'next/server';
import { ProductDetail } from '@/types/fit';
import { getProductByHandle } from '@/lib/shopify/queries';

export async function GET(
  req: Request,
  { params }: { params: { handle: string } }
) {
  const { handle } = params;
  const product = await getProductByHandle(handle);
  return NextResponse.json({ product });
}