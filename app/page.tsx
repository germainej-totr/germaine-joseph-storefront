'use client';

import { useState, useEffect } from 'react';
import FitGateModal from '@/components/FitGateModal';

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProductTitle, setActiveProductTitle] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Call server-side API route instead of shopifyFetch directly
        const response = await fetch('/api/products?first=10');
        const json = await response.json();

        if (json?.products) {
          setProducts(json.products);
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
        <h1 className="text-4xl font-serif font-medium tracking-tight text-zinc-900">
          Tailor On The Road
        </h1>
        <p className="text-zinc-500 mt-2 italic">Curiosity → Desire → Booked → Sale</p>
      </header>

      {/* Empty State UI */}
      {products.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed rounded-xl">
          <p className="text-zinc-400">No products found. See console for logs.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {products.map((product: any) => {
          const node = product.node;
          const isMTM = node.requiresFit?.value === "true" || node.requiresFit?.value === true;
          const mtmCategory = node.category?.value || 'Custom';
          const leadTime = node.leadTime?.value;
          const price = node.priceRange.minVariantPrice;

          return (
            <div key={node.id} className="group flex flex-col border border-zinc-100 rounded-lg overflow-hidden hover:shadow-md transition-all bg-white">
              <div className="aspect-[3/4] overflow-hidden bg-zinc-50">
                <img 
                  src={node.images?.edges[0]?.node?.url || 'https://via.placeholder.com/600x800'} 
                  alt={node.images?.edges[0]?.node?.altText || node.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">{node.title}</h2>
                    <p className="text-sm text-zinc-500 uppercase tracking-widest mt-1">
                      {isMTM ? `${mtmCategory}` : 'Ready to Wear'}
                    </p>
                  </div>
                  <p className="font-medium text-zinc-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: price.currencyCode,
                    }).format(parseFloat(price.amount))}
                  </p>
                </div>

                <div className="mt-8">
                  {isMTM ? (
                    <div className="space-y-3">
                      <button 
                        onClick={() => openFitGate(node.title)}
                        className="w-full bg-zinc-900 text-white py-3 rounded hover:bg-zinc-800 transition-colors font-medium"
                      >
                        Configure Your Fit
                      </button>
                      {leadTime && (
                        <p className="text-[11px] text-center text-zinc-400">
                          Estimated Lead Time: {leadTime} Days
                        </p>
                      )}
                    </div>
                  ) : (
                    <button className="w-full border border-zinc-900 text-zinc-900 py-3 rounded hover:bg-zinc-50 transition-colors font-medium">
                      Add to Bag
                    </button>
                  )}
                </div>
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