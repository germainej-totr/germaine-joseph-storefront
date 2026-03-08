import { cookies } from 'next/headers';

export default async function ProductPage({ params }: { params: { handle: string } }) {
  const handle = params.handle;
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/products/${handle}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  const product = json.product;

  const mtmRequired = product?.metafields?.mtm_required === "true";

  const cookieStore = cookies();
  const fitProfileId = cookieStore.get('fit_profile_id')?.value;

  if (mtmRequired && !fitProfileId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">{product.title}</h1>
        <p className="text-red-600 font-semibold">A fit profile is required before purchasing this item.</p>
        <div className="mt-4 space-x-4">
          <a href="/fit/smart" className="px-4 py-2 bg-blue-600 text-white rounded">Smart Fit</a>
          <a href="/fit/manual" className="px-4 py-2 bg-gray-600 text-white rounded">Manual Entry</a>
          <a href="/fit/book" className="px-4 py-2 bg-green-600 text-white rounded">Book a Fitting</a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{product.title}</h1>
      <p className="text-gray-600 mt-4">{product.description}</p>
      <p className="text-yellow-600 mt-4">TODO: build configurator component and handle add-to-cart with fit info</p>
    </div>
  );
}