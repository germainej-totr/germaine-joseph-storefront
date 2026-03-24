import { NextResponse } from 'next/server';

export async function GET() {
  const hasShopifyAdminToken = Boolean(
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_TOKEN,
  );
  const adminDomain = process.env.SHOPIFY_STORE_DOMAIN || 'MISSING';
  const storefrontDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'MISSING';

  return NextResponse.json({
    runtime: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      adminDomain,
      storefrontDomain,
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      hasResendFrom: Boolean(process.env.RESEND_FROM),
      hasShopifyAdminToken,
    },
  });
}