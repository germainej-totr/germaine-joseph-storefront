import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { fetchShopifyCart, parseCartIdFromCookieHeader } from '@/lib/shopify/cart';

export default async function CheckoutPage() {
  try {
    const cookieStore = await cookies();
    const cartId = parseCartIdFromCookieHeader(cookieStore.toString());

    if (cartId) {
      const cart = await fetchShopifyCart(cartId);
      if (cart?.checkoutUrl) {
        redirect(cart.checkoutUrl);
      }
    }
  } catch {
    // Fall through to cart if checkout handoff cannot be resolved.
  }

  redirect('/cart');

  return null;
}