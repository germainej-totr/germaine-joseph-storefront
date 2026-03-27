// lib/shopify/queries.ts
import { shopifyFetch } from "./storefront";
import { MTM_FRAGMENT } from "./fragments";
import type { ProductDetail } from '@/lib/contracts/productApi';

// Define the shape of the Shopify response to satisfy TypeScript
interface ShopifyProductResponse {
  productByHandle: ProductDetail | null;
}

export async function getProductByHandle(handle: string): Promise<ProductDetail | null> {
  const query = `
    query getProduct($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        handle
        productType
        descriptionHtml
        options {
          id
          name
          values
        }
        variants(first: 50) {
          edges {
            node {
              id
              title
              availableForSale
              selectedOptions {
                name
                value
              }
              price {
                amount
                currencyCode
              }
              image {
                url
                altText
              }
            }
          }
        }
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