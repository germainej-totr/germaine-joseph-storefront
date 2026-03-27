'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type CartLine = {
  id: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string }>;
  merchandise?: {
    title?: string;
    product?: {
      title?: string;
      handle?: string;
    };
    image?: {
      url?: string;
      altText?: string;
    };
    price?: {
      amount?: string;
      currencyCode?: string;
    };
  };
};

type CartResponse = {
  ok: boolean;
  lines: CartLine[];
  cart?: {
    id: string;
    checkoutUrl?: string;
    cost?: {
      subtotalAmount?: { amount?: string; currencyCode?: string };
      totalAmount?: { amount?: string; currencyCode?: string };
    };
  } | null;
  error?: string;
};

function formatMoney(amount?: string, currencyCode?: string) {
  const value = Number(amount ?? 0);
  const currency = currencyCode || 'EUR';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(value);
}

export default function CartPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [activeLineId, setActiveLineId] = useState('');
  const [error, setError] = useState('');
  const [lines, setLines] = useState<CartLine[]>([]);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [subtotal, setSubtotal] = useState<{ amount?: string; currencyCode?: string } | null>(null);
  const [total, setTotal] = useState<{ amount?: string; currencyCode?: string } | null>(null);

  async function loadCart(options?: { silent?: boolean }) {
    try {
      if (!options?.silent) {
        setIsLoading(true);
      }
      setError('');

      const res = await fetch('/api/cart', { method: 'GET' });
      const data: CartResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to load cart');
      }

      setLines(data.lines || []);
      setCheckoutUrl(data.cart?.checkoutUrl || '');
      setSubtotal(data.cart?.cost?.subtotalAmount || null);
      setTotal(data.cart?.cost?.totalAmount || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function updateLineQuantity(lineId: string, nextQuantity: number) {
    try {
      setIsMutating(true);
      setActiveLineId(lineId);
      setError('');

      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineId, quantity: nextQuantity }),
      });

      const data: CartResponse = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Unable to update quantity');
      }

      setLines(data.lines || []);
      setCheckoutUrl(data.cart?.checkoutUrl || '');
      setSubtotal(data.cart?.cost?.subtotalAmount || null);
      setTotal(data.cart?.cost?.totalAmount || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update cart line');
      await loadCart({ silent: true });
    } finally {
      setIsMutating(false);
      setActiveLineId('');
    }
  }

  async function removeLine(lineId: string) {
    try {
      setIsMutating(true);
      setActiveLineId(lineId);
      setError('');

      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineId }),
      });

      const data: CartResponse = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Unable to remove item');
      }

      setLines(data.lines || []);
      setCheckoutUrl(data.cart?.checkoutUrl || '');
      setSubtotal(data.cart?.cost?.subtotalAmount || null);
      setTotal(data.cart?.cost?.totalAmount || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove item');
      await loadCart({ silent: true });
    } finally {
      setIsMutating(false);
      setActiveLineId('');
    }
  }

  const lineCount = useMemo(() => lines.reduce((acc, line) => acc + (line.quantity || 0), 0), [lines]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] px-4 py-10 text-black">
      <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-[1.7fr_1fr]">
        <section className="rounded-2xl border border-zinc-100 bg-white p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-serif uppercase tracking-wider">Your Cart</h1>
          <p className="mt-1 text-sm text-zinc-500">{lineCount} item{lineCount === 1 ? '' : 's'} ready for tailoring.</p>

          {isLoading && <p className="mt-8 text-sm text-zinc-500">Loading cart…</p>}

          {!isLoading && error && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!isLoading && !error && lines.length === 0 && (
            <div className="mt-10 rounded-xl border border-zinc-100 bg-zinc-50 px-6 py-10 text-center">
              <p className="text-zinc-600">Your cart is currently empty.</p>
              <Link
                href="/shop"
                className="mt-4 inline-flex items-center justify-center rounded-sm bg-black px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-900"
              >
                Continue Shopping
              </Link>
            </div>
          )}

          {!isLoading && !error && lines.length > 0 && (
            <div className="mt-8 space-y-4">
              {lines.map((line) => {
                const title = line.merchandise?.product?.title || line.merchandise?.title || 'Product';
                const image = line.merchandise?.image?.url;
                const price = line.merchandise?.price;
                const productFlow = line.attributes?.find((item) => item.key === 'gjm_product_flow')?.value;
                const isBusy = isMutating && activeLineId === line.id;
                const lineAmount = Number(price?.amount || 0) * (line.quantity || 0);

                return (
                  <article key={line.id} className="grid grid-cols-[72px_1fr_auto] items-center gap-4 rounded-xl border border-zinc-100 p-4">
                    <div className="h-[72px] w-[72px] overflow-hidden rounded-md bg-zinc-100">
                      {image ? (
                        <img src={image} alt={line.merchandise?.image?.altText || title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] uppercase tracking-wider text-zinc-400">
                          No Image
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-zinc-900">{title}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-zinc-400">
                        {productFlow ? productFlow.replace(/_/g, ' ') : 'catalog item'}
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy || line.quantity <= 1}
                          onClick={() => updateLineQuantity(line.id, line.quantity - 1)}
                          className="h-7 w-7 rounded border border-zinc-200 text-sm text-zinc-700 hover:border-zinc-400 disabled:opacity-30"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="min-w-5 text-center text-sm font-medium">{line.quantity}</span>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => updateLineQuantity(line.id, line.quantity + 1)}
                          className="h-7 w-7 rounded border border-zinc-200 text-sm text-zinc-700 hover:border-zinc-400 disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => removeLine(line.id)}
                          className="ml-2 text-xs uppercase tracking-wider text-zinc-400 hover:text-red-600 disabled:opacity-30"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="text-right text-sm font-semibold text-zinc-700">
                      {formatMoney(lineAmount.toString(), price?.currencyCode)}
                      <p className="mt-1 text-[11px] font-normal text-zinc-400">{formatMoney(price?.amount, price?.currencyCode)} each</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-zinc-100 bg-white p-6 md:p-8 shadow-sm h-max">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Order Summary</h2>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal?.amount, subtotal?.currencyCode)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="h-px bg-zinc-100" />
            <div className="flex justify-between font-semibold text-zinc-900">
              <span>Total</span>
              <span>{formatMoney(total?.amount || subtotal?.amount, total?.currencyCode || subtotal?.currencyCode)}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={!checkoutUrl || !lines.length || isMutating}
            onClick={() => {
              if (checkoutUrl) {
                window.location.href = checkoutUrl;
              }
            }}
            className="mt-6 w-full rounded-sm bg-black px-4 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Proceed To Checkout
          </button>
        </aside>
      </div>
    </div>
  );
}