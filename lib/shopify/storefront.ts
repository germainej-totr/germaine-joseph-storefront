// lib/shopify/storefront.ts
import { ShopifyProduct } from "@/types/shopify";

// lib/shopify/storefront.ts
const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

export async function shopifyFetch<T>({
  query,
  variables = {},
}: {
  query: string;
  variables?: object;
}): Promise<{ data: T }> {
  const response = await fetch(`https://${DOMAIN}/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify GraphQL Error:", result.errors);
    throw new Error("Failed to fetch from Shopify");
  }

  return result;
}