import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { ProductDetailResponse } from '@/lib/contracts/productApi';
import { getProductByHandle } from '@/lib/shopify/queries';

const PARAMS_SCHEMA = z.object({
  handle: z.string().min(1, 'handle is required'),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const parsedParams = PARAMS_SCHEMA.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json(
      { product: null, error: 'Invalid handle' } satisfies ProductDetailResponse,
      { status: 400 },
    );
  }

  const { handle } = parsedParams.data;
  const product = await getProductByHandle(handle);
  if (!product) {
    return NextResponse.json(
      { product: null, error: 'Product not found' } satisfies ProductDetailResponse,
      { status: 404 },
    );
  }

  return NextResponse.json({ product } satisfies ProductDetailResponse);
}
