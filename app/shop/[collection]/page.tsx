import Link from 'next/link';
import { notFound } from 'next/navigation';
import { shopifyFetch } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

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

interface CollectionResponse {
  data?: {
    collection?: {
      id: string;
      handle: string;
      title: string;
      products?: { edges?: Array<{ node: ProductNode }> };
    };
    collections?: {
      edges?: Array<{ node: CollectionNode }>;
    };
  };
}

export default async function CollectionPage(props: { params: Promise<{ collection: string }> }) {
  const { collection } = await props.params;

  const query = `
    query collectionView($handle: String!, $first: Int!, $collectionFirst: Int!) {
      collection(handle: $handle) {
        id
        handle
        title
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
    variables: { handle: collection, first: 24, collectionFirst: 20 },
  })) as CollectionResponse;

  const selected = payload.data?.collection;
  if (!selected) {
    notFound();
  }

  const products = selected.products?.edges?.map(({ node }) => ({
    id: node.id,
    handle: node.handle,
    title: node.title,
    imageUrl: node.images?.edges?.[0]?.node?.url || undefined,
  })) || [];

  const allCollections = payload.data?.collections?.edges?.map(({ node }) => node) || [];

  return (
    <div className="min-h-screen bg-[#FDFDFD] px-4 py-10 text-black">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Collection</p>
            <h1 className="mt-1 text-3xl font-serif uppercase tracking-wider">{selected.title}</h1>
          </div>
          <Link
            href="/shop"
            className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
          >
            Back to All
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/shop"
            className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
          >
            All
          </Link>
          {allCollections.map((entry) => {
            const isActive = entry.handle === selected.handle;
            return (
              <Link
                key={entry.id}
                href={`/shop/${entry.handle}`}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
                  isActive
                    ? 'bg-black text-white'
                    : 'border border-zinc-300 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'
                }`}
              >
                {entry.title}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.handle}`}
              className="group block overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="aspect-[4/5] overflow-hidden bg-zinc-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-base font-semibold text-zinc-900">{product.title}</h2>
                <p className="mt-1 text-xs uppercase tracking-widest text-zinc-400">View product</p>
              </div>
            </Link>
          ))}
        </div>

        {!products.length && (
          <div className="mt-10 rounded-xl border border-zinc-100 bg-white p-8 text-center text-zinc-500">
            No products found in this collection yet.
          </div>
        )}
      </div>
    </div>
  );
}