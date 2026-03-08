import { NextResponse } from 'next/server';
import { ProductSummary } from '@/types/fit';
import { shopifyFetch } from '@/lib/shopify';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const first = parseInt(url.searchParams.get('first') || '12', 10);

    const query = `
      query listProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              handle
              title
              images(first: 1) { edges { node { url altText } } }
              mtmRequired: metafield(namespace: "gjc", key: "mtm_required") {
                value
              }
            }
          }
        }
      }
    `;

    const response = await shopifyFetch({ query, variables: { first } });
    
    if (!response) {
      console.error('[/api/products] shopifyFetch returned null');
      return NextResponse.json({ products: [], error: 'Failed to fetch products' }, { status: 500 });
    }

    const data = response.data || response;
    const edges = data?.products?.edges || [];
    
    const products: ProductSummary[] = edges.map((e: any) => {
      const p = e.node;
      return {
        id: p.id,
        handle: p.handle,
        title: p.title,
        imageUrl: p.images?.edges[0]?.node.url,
        mtmRequired: p.mtmRequired?.value === 'true',
      };
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('[/api/products] Error:', error);
    return NextResponse.json({ products: [], error: String(error) }, { status: 500 });
  }
}