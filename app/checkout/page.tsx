import { redirect } from 'next/navigation';

export default function CheckoutPage() {
  // redirect immediately to Shopify checkout; placeholder URL
  if (typeof window !== 'undefined') {
    redirect('https://your-shop-name.myshopify.com/cart');
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Redirecting to Checkout...</h1>
    </div>
  );
}