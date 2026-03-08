# Work Package A2: Routing Map, API Contracts & TypeScript Interfaces

This package builds on the routing skeleton from B1 and adds explicit API
contracts and shared TypeScript interfaces for data flowing through the BFF.
It ties together PLP/PDP pages with backend endpoints, ensuring type safety and
clear expectations for each service.

## 1. Frontend route overview (same as B1)

The public-facing routes live under `/app`:

```
/shop
  /[collection]
/product/[handle]
/fit/smart
/fit/manual
/fit/book
/cart
/checkout
```

Each page will fetch data from corresponding API endpoints documented below.

## 2. API endpoint contracts

### `GET /api/products` (PLP)
- Query params: `collection?`, `first?`, `after?`
- Response: `{ products: ProductSummary[] }`

### `GET /api/products/[handle]` (PDP)
- Path param: `handle`
- Response: `{ product: ProductDetail }`

### `POST /api/fit/profile` (create/update fit profile)
- Body: `FitProfileCreate`
- Response: `FitProfile`

### `GET /api/fit/profile/[id]` (fetch profile)
- Path param: `id`
- Response: `FitProfile`

### `POST /api/bookings/availability` (search slots)
- Body: `AvailabilityRequest`
- Response: `AvailabilityResponse`

### `POST /api/bookings` (create booking)
- Body: `BookingCreate`
- Response: `BookingRecord`

### `GET /api/cart` (fetch cart data)
- Returns the current Shopify cart object via storefront token/cookie.

### `POST /api/cart/add` (add item)
- Body: `CartAddRequest` including `fit_profile_id` and `mtm_spec` properties.

## 3. TypeScript interfaces (in `types/` folder)

Add or extend interfaces for:

- `ProductSummary` (used by PLP)
- `ProductDetail` (PDP plus MTM metadata)
- `MtmSpec` (immutable snapshot)
- `CartAddRequest`
- `BookingCreate` / `BookingRecord`
- `FitProfileCreate`

These definitions will be imported by both pages and API routes, ensuring
alignment. Existing `types/mtm.ts`, `types/fit.ts`, `types/booking.ts` already
contain portions; we will extend them.

## 4. API route skeletons

Create serverless route files under `/app/api/` that implement the above
types:

- `app/api/products/route.ts`
- `app/api/products/[handle]/route.ts`
- `app/api/fit/profile/route.ts` (+ `[id]/route.ts`)
- `app/api/bookings/availability/route.ts` and `/app/api/bookings/route.ts`
- `app/api/cart/route.ts` and `/app/api/cart/add/route.ts`

Each handler will validate input (Zod) and export simple placeholders or
`return NextResponse.json({})` with typed generics.

## 5. Next steps after A2

1. Implement each API route using `lib/` helpers (e.g. `lib/shopify.ts`,
   `lib/booking-service.ts`).
2. Enhance PLP/PDP pages to call these endpoints instead of hitting Shopify
directly.
3. Build fit flows (`/fit/*`) to call profile APIs.
4. Add cart interactions and persist `mtm_spec` data.

---

Completing A2 ensures a fully typed, aligned frontend/back-end contract that
will make subsequent feature development predictable and maintainable.
