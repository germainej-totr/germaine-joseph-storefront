'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FitGateModal from '@/components/FitGateModal';
import type { ProductSummary } from '@/types/fit';

type HomeProduct = ProductSummary & { imageUrl?: string };

export default function HomePage() {
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProductTitle, setActiveProductTitle] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products?first=10');
        
        if (!response.ok) {
          console.error(`API error: ${response.status} ${response.statusText}`);
          setLoading(false);
          return;
        }

        const json = await response.json();

        if (json?.products) {
          setProducts(json.products);
        } else {
          console.warn('No products returned:', json);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const openFitGate = (title: string) => {
    setActiveProductTitle(title);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-20 text-center font-serif italic text-zinc-400">
        <p className="animate-pulse">Consulting the atelier records...</p>
        <p className="text-xs mt-2 text-zinc-300">(Check Browser Console for Heartbeat logs)</p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-10">
      <header className="mb-12 border-b pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-serif font-medium tracking-tight text-zinc-900">
              Tailor On The Road
            </h1>
            <p className="mt-2 italic text-zinc-500">Curiosity → Desire → Booked → Sale</p>
          </div>

          <Link
            href="/account"
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
          >
            Account
          </Link>
        </div>
      </header>

      {/* Empty State UI */}
      {products.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed rounded-xl">
          <p className="text-zinc-400">No products found. See console for logs.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {products.map((product) => {
          const isMTM = product.mtmRequired || false;

          return (
            <div key={product.id} className="group flex flex-col border border-zinc-100 rounded-lg overflow-hidden hover:shadow-md transition-all bg-white cursor-pointer" onClick={() => openFitGate(product.title)}>
              <div className="aspect-[3/4] overflow-hidden bg-zinc-50">
                <img 
                  src={product.imageUrl || 'https://via.placeholder.com/600x800'} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">{product.title}</h2>
                    <p className="text-sm text-zinc-500 uppercase tracking-widest mt-1">
                      {isMTM ? 'Custom MTM' : 'Ready to Wear'}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-zinc-600 mt-4 flex-grow">Click to explore fit options</p>

                <button className="mt-6 w-full py-2 border border-zinc-900 text-zinc-900 text-sm font-semibold uppercase hover:bg-zinc-900 hover:text-white transition-colors">
                  {isMTM ? 'Create Fit Profile' : 'Configure Your Fit'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <FitGateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        productTitle={activeProductTitle}
      />
    </main>
  );
}