/**
 * Utility to fetch data from the Shopify Storefront API.
 * Optimized for Next.js 16 Client/Server environments.
 * DEBUG MODE: Enabled
 */

export async function shopifyFetch({ query, variables = {} }: { query: string; variables?: any }) {
  // 1. LOUD CALL LOG
  console.log("🚀 [shopifyFetch] Function initiated");
  
  // 2. Variable Mapping
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const apiVersion = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || '2024-10';

  // 3. LOUD CREDENTIALS LOG
  console.log("🔑 [shopifyFetch] Credentials Check:", { 
    domain: domain || "UNDEFINED", 
    token: accessToken ? "PRESENT (HIDDEN)" : "MISSING",
    version: apiVersion 
  });

  if (!domain || !accessToken) {
    console.error("❌ [shopifyFetch] Error: Missing Environment Variables");
    return null;
  }

  const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;
  console.log("🌐 [shopifyFetch] Target Endpoint:", endpoint);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 0 }, 
    });

    // 4. LOUD RESPONSE STATUS LOG
    console.log("📡 [shopifyFetch] HTTP Status:", res.status, res.statusText);

    const json = await res.json();

    if (json.errors) {
      console.error("❌ [shopifyFetch] GraphQL Errors:", JSON.stringify(json.errors, null, 2));
      return null;
    }

    // 5. LOUD DATA SUCCESS LOG
    console.log("✅ [shopifyFetch] Data successfully retrieved:", {
        hasData: !!json.data,
        productCount: json.data?.products?.edges?.length || 0
    });

    return json;

  } catch (error) {
    console.error("❌ [shopifyFetch] Network Error:", error);
    return null;
  }
}