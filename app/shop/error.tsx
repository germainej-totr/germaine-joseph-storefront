'use client';

import Link from 'next/link';

interface ShopErrorProps {
  error: Error;
  reset: () => void;
}

export default function ShopError({ error, reset }: ShopErrorProps) {
  return (
    <div className="min-h-screen bg-[#FDFDFD] px-4 py-10 text-black">
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">Shop Error</p>
        <h1 className="mt-2 text-2xl font-serif uppercase tracking-wider">We Could Not Load The Shop</h1>
        <p className="mt-3 text-sm text-zinc-600">{error.message || 'An unexpected error occurred while loading products.'}</p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-sm bg-black px-4 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-zinc-900"
          >
            Retry
          </button>
          <Link
            href="/"
            className="rounded-sm border border-zinc-300 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-700 hover:border-zinc-900 hover:text-zinc-900"
          >
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
