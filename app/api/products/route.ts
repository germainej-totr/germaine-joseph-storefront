import { NextResponse } from 'next/server';
import { ProductSummary } from '@/types/fit';
import { shopifyFetch } from '@/lib/shopify/storefront';

export async function GET(req: Request) {
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
            metafields(namespace: "totr", first: 2) {
              edges { node { key value } }
            }
          }
        }
      }
    }
  `;
  const { data } = await shopifyFetch<any>({ query, variables: { first } });
  const edges = data?.products?.edges || [];
  const products: ProductSummary[] = edges.map((e: any) => {
    const p = e.node;
    return {
      id: p.id,
      handle: p.handle,
      title: p.title,
      imageUrl: p.images?.edges[0]?.node.url,
      mtmRequired: p.metafields.edges.some((m: any) => m.node.key === 'mtm_required' && m.node.value === 'true'),
    };
  });
  return NextResponse.json({ products });
}