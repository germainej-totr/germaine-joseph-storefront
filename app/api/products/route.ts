import { NextResponse } from 'next/server';
import { ProductSummary } from '@/types/fit';

// Placeholder: query Shopify or your BFF layer
export async function GET(req: Request) {
  // TODO: parse collection, pagination from URLSearchParams
  const sample: ProductSummary[] = [];
  return NextResponse.json({ products: sample });
}