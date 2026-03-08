import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // TODO: read cart token from cookies and fetch from Shopify
  return NextResponse.json({ items: [] });
}