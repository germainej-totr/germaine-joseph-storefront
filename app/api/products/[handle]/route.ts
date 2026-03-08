import { NextResponse } from 'next/server';
import { ProductDetail } from '@/types/fit';

export async function GET(
  req: Request,
  { params }: { params: { handle: string } }
) {
  const { handle } = params;
  const sample: ProductDetail = {
    id: 'gid://shopify/Product/1',
    handle,
    title: 'Sample Product',
  };
  return NextResponse.json({ product: sample });
}