# Work Package A2: Routing Map, API Contracts & TypeScript Interfaces

This package aligns storefront routing and BFF contracts so page links,
API handlers, and shared types all follow one stable model.

## 1. Frontend route contract

Canonical storefront routes:

```
/c
/c/[collectionHandle]
/p/[productHandle]
/fit/smart
/fit/manual
/fit/book
/cart
/checkout
```

Compatibility routes kept active during migration:

```
/shop
/shop/[collection]
/product/[handle]
```

Current status:

- Canonical link generation now uses `/c/*` and `/p/*` in primary storefront flows.
- Legacy `/shop/*` and `/product/*` routes remain live to avoid breakage.
- Recovery and product entry should route through canonical `/p/*` product pages.

## 2. API endpoint contracts

### `GET /api/products` (PLP)

- Query params: `collection?`, `first?`, `after?`
- Response: `{ products: ProductSummary[] }`

### `GET /api/products/[handle]` (PDP)

- Path param: `handle`
- Response: `{ product: ProductDetail | null }`

### `POST /api/fit/profile` (create/update fit profile)

- Body: `FitProfileCreate`
- Response: `FitProfile`

### `GET /api/fit/profile/[id]` (fetch profile)

- Path param: `id`
- Response: `FitProfile`

### `POST /api/bookings/availability` (search slots)

- Body: `{ date: string; serviceType?: ServiceTypeId }`
- Response: `AvailabilityResponse`

### `POST /api/bookings/confirm` (create booking)

- Body: `AppointmentRequest`
- Response: `{ success: boolean; bookingId?: string; message: string }`

### `GET /api/bookings/service-types` (booking catalog)

- Response: `{ serviceTypes: ServiceTypeOption[] }`
- Source of truth: `gjm_service_type` metaobjects with safe fallback defaults.

### `GET /api/cart` (fetch cart data)

- Returns current Shopify cart object via storefront token/cookie.

### `POST /api/cart/add` (generic add)

- Body: `CartAddRequest`
- Writes normalized `gjm_*` line item attributes for MTM payloads.

### `POST /api/cart/add-mtm-trouser` (trouser MTM add)

- Body: trouser MTM payload with custom attributes.
- Normalizes to shared `gjm_*` contract before validation and cart mutation.

## 3. TypeScript interface alignment

Shared interfaces are expected to stay centralized in `types/` and imported by
both pages and API handlers:

- `ProductSummary`, `ProductDetail`
- `MtmSpec`, `MtmLineItemProperties`
- `CartAddRequest`
- `AppointmentRequest`, `AvailabilityResponse`, `ServiceTypeOption`
- `BookingCreate`, `BookingRecord`
- `FitProfileCreate`

## 4. A2 completion criteria (current repo state)

1. Canonical `/c/*` + `/p/*` routes exist and are usable.
2. Legacy `/shop/*` + `/product/*` compatibility remains intact.
3. Primary storefront links point to canonical routes.
4. Booking API includes service-type catalog endpoint and typed client usage.
5. Cart MTM payloads use normalized `gjm_*` attributes.

## 5. Contract quality gate

Run one command to verify API and routing contracts stay aligned:

`npm run test:contracts`

This bundles:

- `test:api-contracts`
- `test:routing-contract`
- `test:home-product-card-flow`

## 6. Next step after A2

Route/API naming normalization for remaining edge flows:

1. Keep any demo/sandbox routes non-canonical and out of customer recovery flows.
2. Add explicit redirect strategy if and when `/shop/*` and `/product/*` are deprecated.
3. Reconcile docs and monitoring dashboards to treat `/c/*` and `/p/*` as the default route family.
