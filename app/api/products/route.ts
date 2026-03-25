import { NextResponse } from 'next/server';
import { ProductSummary } from '@/types/fit';
import { shopifyFetch } from '@/lib/shopify';

function safePreview(value: unknown, max = 500) {
  try {
    return JSON.stringify(value, null, 2).slice(0, max);
  } catch {
    return '[unserializable response]';
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const firstRaw = parseInt(url.searchParams.get('first') || '12', 10);
    const first = Number.isFinite(firstRaw) ? Math.min(Math.max(firstRaw, 1), 50) : 12;
    const collection = url.searchParams.get('collection')?.trim();

    const query = collection
      ? `
          query listCollectionProducts($first: Int!, $handle: String!) {
            collection(handle: $handle) {
              title
              handle
              products(first: $first) {
                edges {
                  node {
                    id
                    handle
                    title
                    images(first: 1) { edges { node { url altText } } }
                  }
                }
              }
            }
          }
        `
      : `
          query listProducts($first: Int!) {
            products(first: $first) {
              edges {
                node {
                  id
                  handle
                  title
                  images(first: 1) { edges { node { url altText } } }
                }
              }
            }
          }
        `;

    const response = await shopifyFetch({
      query,
      variables: collection ? { first, handle: collection } : { first },
    });

    let payload: any = response;
    if (response instanceof Response) {
      payload = await response.json();
    }

    console.log('[/api/products] payload preview:', safePreview(payload));

    if (!payload) {
      return NextResponse.json(
        { products: [], error: 'Empty Shopify response' },
        { status: 502 }
      );
    }

    if (payload.errors?.length) {
      return NextResponse.json(
        { products: [], error: 'Shopify GraphQL errors', details: payload.errors },
        { status: 502 }
      );
    }

    const data = payload.data ?? payload;
    const edges = collection
      ? data?.collection?.products?.edges ?? []
      : data?.products?.edges ?? [];

    const products: ProductSummary[] = edges.map((e: any) => {
      const p = e.node;
      return {
        id: p.id,
        handle: p.handle,
        title: p.title,
        imageUrl: p.images?.edges?.[0]?.node?.url,
        mtmRequired: false,
      };
    });

    if (collection && !data?.collection) {
      return NextResponse.json(
        { products: [], error: 'Collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        products,
        collection: collection
          ? { handle: data.collection.handle, title: data.collection.title }
          : null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[/api/products] Error:', error);
    return NextResponse.json(
      { products: [], error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}