import Link from 'next/link';
import { headers } from 'next/headers';
import type { ProductSummary } from '@/types/fit';

type ShopProduct = ProductSummary & { imageUrl?: string };

export default async function ShopPage() {
  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host') || '';
  const proto = headerStore.get('x-forwarded-proto') || 'https';
  const fallbackOrigin = host ? `${proto}://${host}` : '';
  const origin = process.env.NEXT_PUBLIC_BASE_URL || fallbackOrigin;

  if (!origin) {
    throw new Error('Unable to resolve origin for /shop product fetch');
  }

  // fetch products from our BFF endpoint
  const res = await fetch(`${origin}/api/products?first=12`, {
    cache: 'no-store',
  });
  const json = await res.json();
  const products = (json.products || []) as ShopProduct[];

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