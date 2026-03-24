import Link from 'next/link';
import type { ProductSummary } from '@/types/fit';
import { shopifyFetch } from '@/lib/shopify';

type ShopProduct = ProductSummary & { imageUrl?: string };

interface ProductNode {
  id: string;
  handle: string;
  title: string;
  images?: { edges?: Array<{ node?: { url?: string | null } }> };
}

interface ListProductsResponse {
  data?: {
    products?: {
      edges?: Array<{ node: ProductNode }>;
    };
  };
  errors?: Array<{ message?: string }>;
}

export default async function ShopPage() {
  const query = `
    query listProducts($first: Int!) {
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
  `;

  const payload = (await shopifyFetch({
    query,
    variables: { first: 12 },
  })) as ListProductsResponse;

  const edges = payload.data?.products?.edges || [];
  const products: ShopProduct[] = edges.map(({ node }) => ({
    id: node.id,
    handle: node.handle,
    title: node.title,
    imageUrl: node.images?.edges?.[0]?.node?.url || undefined,
    mtmRequired: false,
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Shop</h1>
        <Link
          href="/account"
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
        >
          Account
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <a
            key={p.id}
            href={`/product/${p.handle}`}
            className="block border rounded-lg overflow-hidden hover:shadow-lg"
          >
            {p.imageUrl && (
              <img
                src={p.imageUrl}
                alt={p.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h2 className="text-lg font-semibold">{p.title}</h2>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}