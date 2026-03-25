import Link from 'next/link';
import type { ProductSummary } from '@/types/fit';
import { shopifyFetch } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

type ShopProduct = ProductSummary & { imageUrl?: string };

interface ProductNode {
  id: string;
  handle: string;
  title: string;
  images?: { edges?: Array<{ node?: { url?: string | null } }> };
}

interface CollectionNode {
  id: string;
  handle: string;
  title: string;
}

interface ListProductsResponse {
  data?: {
    products?: {
      edges?: Array<{ node: ProductNode }>;
    };
    collections?: {
      edges?: Array<{ node: CollectionNode }>;
    };
  };
  errors?: Array<{ message?: string }>;
}

export default async function ShopPage() {
  const query = `
    query listProducts($first: Int!, $collectionFirst: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            handle
            title
            images(first: 1) { edges { node { url } } }
          }
        }
      }
      collections(first: $collectionFirst, sortKey: TITLE) {
        edges {
          node {
            id
            handle
            title
          }
        }
      }
    }
  `;

  const payload = (await shopifyFetch({
    query,
    variables: { first: 18, collectionFirst: 20 },
  })) as ListProductsResponse;

  const edges = payload.data?.products?.edges || [];
  const collectionEdges = payload.data?.collections?.edges || [];
  const products: ShopProduct[] = edges.map(({ node }) => ({
    id: node.id,
    handle: node.handle,
    title: node.title,
    imageUrl: node.images?.edges?.[0]?.node?.url || undefined,
    mtmRequired: false,
  }));

  const collections = collectionEdges.map(({ node }) => ({
    id: node.id,
    handle: node.handle,
    title: node.title,
  }));

  return (
    <div className="min-h-screen bg-[#FDFDFD] px-4 py-10 text-black">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Germaine Joseph</p>
            <h1 className="mt-1 text-3xl font-serif uppercase tracking-wider">Shop All</h1>
          </div>
          <Link
            href="/account"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
          >
            Account
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/shop"
            className="rounded-full bg-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
          >
            All
          </Link>
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/shop/${collection.handle}`}
              className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
            >
              {collection.title}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.handle}`}
              className="group block overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="aspect-[4/5] overflow-hidden bg-zinc-100">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-base font-semibold text-zinc-900">{p.title}</h2>
                <p className="mt-1 text-xs uppercase tracking-widest text-zinc-400">View product</p>
              </div>
            </Link>
          ))}
        </div>

        {!products.length && (
          <div className="mt-10 rounded-xl border border-zinc-100 bg-white p-8 text-center text-zinc-500">
            No products available right now.
          </div>
        )}
      </div>
    </div>
  );
}