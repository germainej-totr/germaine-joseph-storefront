// lib/shopify/queries.ts
import { shopifyFetch } from "./storefront";
import { MTM_FRAGMENT, OPTIONSET_QUERY } from "./fragments";

// Define the shape of the Shopify response to satisfy TypeScript
interface ShopifyProductResponse {
  productByHandle: any; // Or define a full interface if you want strict typing
}

export async function getProductByHandle(handle: string) {
  const query = `
    query getProduct($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        handle
        descriptionHtml
        ...MTMMeta
      }
    }
    ${MTM_FRAGMENT}
  `;

  // Explicitly pass the type <ShopifyProductResponse>
  const { data } = await shopifyFetch<ShopifyProductResponse>({ 
    query, 
    variables: { handle } 
  });
  
  return data.productByHandle;
}