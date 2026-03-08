# Work Package B1: Routing Map & Placeholder Pages

The goal of this package is to establish the URL structure for the headless
storefront and create lightweight placeholders for key routes so that later
features can plug into an existing skeleton. This also aligns with the
"Architecture diagram" focus on PLP/PDP, fit gating, and booking flows.

## 1. Route hierarchy

```txt
/
  /shop                 -> PLP (product listing)
    /[collection]       -> collection-based category filters
  /product/[handle]     -> PDP (custom builder + fit gate)
  /fit
    /smart              -> Smart Fit wizard
    /manual             -> Manual measurement entry
    /book               -> Booking scheduler standalone
  /cart
  /checkout             -> will redirect to Shopify hosted checkout

/admin
  /dashboard            -> Atelier/Tailors dashboard (existing)
  /fitting/[id]         -> individual fitting session (existing)
  ...                  -> already structured

/booking-confirmed      -> existing thank-you page
/configure-fit          -> existing secondary flow
/measure                -> existing measure page
/share/profile          -> existing share route
/tailor/jacket          -> existing tailor pages
/test-db                -> development/test page
```

## 2. Placeholder components

For each of the new storefront routes, add minimal React server components
with comments indicating future responsibilities.

- `app/shop/page.tsx`  - PLP overview, will fetch product listings
- `app/shop/[collection]/page.tsx` - category filters
- `app/product/[handle]/page.tsx` - PDP with customization UI and fit gate
- `app/fit/smart/page.tsx` - Smart Fit wizard
- `app/fit/manual/page.tsx` - Manual measurement entry form
- `app/fit/book/page.tsx` - Booking scheduler (could reuse existing booking logic)
- `app/cart/page.tsx` - Cart review
- `app/checkout/page.tsx` - Placeholder redirecting to Shopify checkout

Each component should be server components with basic markup and `TODO` notes.

## 3. Next actions after skeleton

1. Implement PLP data fetching using `lib/shopify.ts` and render product cards.
2. Add PDP builder with customisation options/multiple components.
3. Build fit gating logic that intercepts adds to cart and navigates to `/fit`.
4. Integrate booking scheduler (reusing `lib/booking-service.ts` once spec defined).
5. Add cart page that reads from Shopify cart token via BFF.


*End of Work Package B1.*
