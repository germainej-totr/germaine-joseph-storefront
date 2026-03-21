/**
 * Utility to fetch data from the Shopify Storefront API.
 * Server-side only - uses non-public credentials.
 */

function normalizeShopDomain(raw?: string) {
  if (!raw) return '';
  return raw.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

export async function shopifyFetch({
  query,
  variables = {},
}: {
  query: string;
  variables?: any;
}) {
  const domain = normalizeShopDomain(process.env.SHOPIFY_STORE_DOMAIN);
  const accessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2025-10';

  if (!domain || !accessToken) {
    console.error('❌ [shopifyFetch] Missing Shopify Storefront credentials');
    return { errors: [{ message: 'Missing Shopify Storefront credentials' }] };
  }

  const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    });

    const json = await res.json();

    if (!res.ok) {
      console.error(`❌ [shopifyFetch] HTTP ${res.status}:`, json);
      return { errors: [{ message: `HTTP ${res.status}` }, ...(json?.errors || [])] };
    }

    if (json?.errors?.length) {
      console.error('❌ [shopifyFetch] GraphQL Errors:', JSON.stringify(json.errors, null, 2));
      return json; // return errors so caller can handle
    }

    return json;
  } catch (error) {
    console.error('❌ [shopifyFetch] Network Error:', error);
    return { errors: [{ message: error instanceof Error ? error.message : String(error) }] };
  }
}

// ------------------------------------------------------------------------
// Admin API helpers (secure, server-side only)
// ------------------------------------------------------------------------

const SHOP_DOMAIN = normalizeShopDomain(process.env.SHOPIFY_STORE_DOMAIN);
const ADMIN_TOKEN =
  process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_TOKEN;
const ADMIN_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';

if (process.env.NODE_ENV === 'production' && (!SHOP_DOMAIN || !ADMIN_TOKEN)) {
  throw new Error('Missing Shopify admin credentials in environment');
}

async function adminRequest(path: string, options: RequestInit = {}) {
  const url = `https://${SHOP_DOMAIN}/admin/api/${ADMIN_VERSION}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN!,
      ...((options.headers as Record<string, string>) || {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify admin request failed ${res.status}: ${text}`);
  }

  return res.json();
}

export async function shopifyAdminGraphQL(query: string, variables?: Record<string, any>) {
  return adminRequest('/graphql.json', {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
  });
}

export async function shopifyAdminREST(path: string, options: RequestInit = {}) {
  return adminRequest(path, options);
}