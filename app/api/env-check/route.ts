import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    test: process.env.TEST_VAR || "STILL NOT FOUND",
    domain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "MISSING",
  });
}