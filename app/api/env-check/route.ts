import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    runtime: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      domain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'MISSING',
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      hasResendFrom: Boolean(process.env.RESEND_FROM),
      hasShopifyAdminToken: Boolean(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN),
    },
  });
}