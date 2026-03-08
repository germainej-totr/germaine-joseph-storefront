'use client';
import { useState, useEffect } from 'react';
import FitGateModal from '@/components/FitGateModal';

export default function ProductPage({ params }: { params: { handle: string } }) {
  const handle = params.handle;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mtmRequired, setMtmRequired] = useState(false);
  const [hasFitProfile, setHasFitProfile] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(`/api/products/${handle}`);
      const json = await res.json();
      setProduct(json.product);
      const required = json.product?.metafields?.mtm_required === "true";
      setMtmRequired(required);

      // Check for fit profile cookie
      const cookies = document.cookie.split(';');
      const fitProfileCookie = cookies.find(c => c.trim().startsWith('fit_profile_id='));
      setHasFitProfile(!!fitProfileCookie);

      if (required && !fitProfileCookie) {
        setShowModal(true);
      }

      setLoading(false);
    };

    fetchProduct();
  }, [handle]);

  const [addingToCart, setAddingToCart] = useState(false);

  const addToCart = async () => {
    setAddingToCart(true);
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId: product.variants?.[0]?.id,
          quantity: 1,
          fitProfileId: hasFitProfile ? document.cookie.split(';').find(c => c.trim().startsWith('fit_profile_id='))?.split('=')[1] : null
        }),
      });
      if (response.ok) {
        alert('Added to cart!');
        // Optionally redirect to cart
        // window.location.href = '/cart';
      } else {
        alert('Failed to add to cart');
      }
    } catch (error) {
      alert('Error adding to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!product) {
    return <div className="p-8">Product not found</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{product.title}</h1>
      <p className="text-gray-600 mt-4">{product.description}</p>
      {!mtmRequired || hasFitProfile ? (
        <div className="mt-4">
          <button 
            onClick={addToCart} 
            disabled={addingToCart}
            className="px-4 py-2 bg-black text-white rounded disabled:bg-gray-400"
          >
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      ) : (
        <p className="text-red-600 font-semibold">A fit profile is required before purchasing this item.</p>
      )}

      <FitGateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        productTitle={product.title}
      />
    </div>
  );
}