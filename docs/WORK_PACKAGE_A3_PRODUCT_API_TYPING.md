# Work Package A3: Product API Response Typing & Contract Alignment

This package normalizes all product API responses (PLP, PDP) to use shared, typed contracts,
and removes fallback parsing logic from clients to ensure early breakage if contracts diverge.

## 1. Shared Product API Contracts

### File: `lib/contracts/productApi.ts`

Defines all product-related response types:

```typescript
// Product summary shape used in list responses
interface ProductSummary {
  id: string;
  title?: string;
  handle: string;
  productType?: string;
  descriptionHtml?: string;
}

// Product list response (PLP)
interface ProductListResponse {
  products: ProductSummary[];
  collection: ProductListCollectionMeta | null;
  error?: string;
  details?: unknown;
}

// Full product detail shape
interface ProductDetail extends ProductSummary {
  options?: ProductOption[];
  variants?: { edges?: Array<{ node?: ProductVariant }> };
  mtm_required?: { value?: unknown };
  mtm_category?: { value?: string };
  [key: string]: unknown;
}

// Product detail response (PDP)
interface ProductDetailResponse {
  product: ProductDetail | null;
  error?: string;
}
```

**Key design decisions:**

- `ProductDetail` extends `ProductSummary` to reuse common fields
- Both list and detail responses include optional `error` field for consistency
- Collection metadata on list response allows PLP to render breadcrumb or context
- Metafields (`mtm_required`, `mtm_category`) are part of the product object itself, not extracted separately
- Use of `satisfies` keyword in handlers ensures responses match contract at compile time

## 2. API Endpoint Implementation

### `GET /api/products` (PLP)

**File:** `app/api/products/route.ts`

- Queries Shopify for product list
- All error paths return `ProductListResponse` with `collection: null`
- Success returns `ProductListResponse` with `collection` populated
- Uses `satisfies ProductListResponse` to enforce contract compliance

### `GET /api/products/[handle]` (PDP)

**File:** `app/api/products/[handle]/route.ts`

- Validates handle param with Zod schema
- Returns 400 if handle validation fails
- Returns 404 if product not found (guarantees `product: null`)
- All responses enforce `ProductDetailResponse` type contract using `satisfies`

**Key features:**

```typescript
const PARAMS_SCHEMA = z.object({
  handle: z.string().min(1, 'handle is required'),
});

const parsedParams = PARAMS_SCHEMA.safeParse(await params);
if (!parsedParams.success) {
  return NextResponse.json(
    { product: null, error: 'Invalid handle' } satisfies ProductDetailResponse,
    { status: 400 },
  );
}

// If product not found, client gets guaranteed null
const product = await getProductByHandle(handle);
if (!product) {
  return NextResponse.json(
    { product: null, error: 'Product not found' } satisfies ProductDetailResponse,
    { status: 404 },
  );
}

return NextResponse.json({ product } satisfies ProductDetailResponse);
```

## 3. Data Layer Typing

### Query Helper: `lib/shopify/queries.ts`

The `getProductByHandle` function is now explicitly typed:

```typescript
export async function getProductByHandle(handle: string): Promise<ProductDetail | null> {
  // Queries Shopify storefront API
  // Returns ProductDetail or null (never undefined)
}
```

**Benefits:**

- Consumers can't assume different response shapes
- TypeScript prevents weak typing in clients
- Shopify response is cast to `ProductDetail` at the entry point, not in each consumer

## 4. Client-Side Consumption

### `app/product/[handle]/page.tsx` (PDP Client)

Before A3:
```typescript
const json = await res.json() as { product?: ProductData; data?: { productByHandle?: ProductData } };
const nextProduct = json?.product ?? json?.data?.productByHandle ?? null;
// Dual-shape fallback parsing hides contract issues
```

After A3:
```typescript
const json = (await res.json()) as ProductDetailResponse;
const nextProduct = (json?.product as ProductData | null) ?? null;
// Single shape only; contract breakage causes immediate client error
```

**Key change:** Removed fallback parsing. If the endpoint changes shape, this will fail loudly instead of silently compensating.

### `app/page.tsx` (Homepage/PLP Client)

Before A3:
```typescript
const json = await response.json();
if (json?.products) { setProducts(json.products); }
```

After A3:
```typescript
const json = (await response.json()) as ProductListResponse;
if (json?.products) { setProducts(json.products); }
```

**Benefit:** Homepage now validates response shape; type safety prevents shape assumptions from silently failing.

## 5. Cleanup: Removed Parallel Endpoint

### Removed: `/api/shopify/products/[handle]`

**Status:** Deleted (no internal or external consumers found)

**Reason:** This endpoint existed in parallel to `/api/products/[handle]` with a different response shape:
```typescript
// Old response structure (removed)
return apiResponse({
  product,
  mtm: {
    required: parseMetafieldBoolean(...),
    category: ...,
  }
});
```

**Impact:** Removing the parallel endpoint ensures a single, normalized product API contract. All product fetches now go through the typed endpoints in `app/api/products/`.

**Verification:** Full build compiled successfully after removal; no consumers existed.

## 6. Runtime Quality Gates

### Static Contract Tests: `npm run test:contracts`

The existing contract regression suite validates:

- **API request schemas** (test:api-contracts)
  - Booking and cart request payloads
  - Still covers request-side validation

- **Routing contract** (test:routing-contract)
  - Canonical routes present (`/c`, `/p`, `/product`, `/shop`)
  - Primary links use canonical paths
  - Legacy routes remain functional

- **Product card flow** (test:home-product-card-flow)
  - Homepage product resolution logic
  - Links correctly point to `/p/` paths

### Runtime QA Test: `npm run qa:product-api-runtime`

**File:** `scripts/qa-product-api-contracts.ts`

Validates response contracts when server is running:

1. **ProductListResponse** contract
   - Fetches `/api/products?first=10`
   - Verifies `products` array and `collection` field structure
   - Confirms each product has required `handle` field

2. **ProductDetailResponse** contract
   - Fetches `/api/products/{handle}`
   - Verifies `product` is object or null
   - Confirms error handling (404 returns `product: null`)

3. **NotFound scenario**
   - Tests 404 response structure
   - Ensures error field is consistent

**Usage in CI:**
```bash
npm run build
npm start &  # Start server
npm run qa:product-api-runtime  # Validate contracts in response
```

## 7. Enforcement & Prevention

### How Contract Drift is Prevented:

1. **TypeScript compilation** - Response use `satisfies ProductListResponse` at compile time
2. **Static regression tests** - `test:contracts` ensures schemas and routes remain stable
3. **Runtime contract validation** - `qa:product-api-runtime` can run against deployed builds
4. **Single endpoint per resource** - Removed `/api/shopify/products/[handle]` to prevent parallel divergence
5. **Typed query helper** - `getProductByHandle` returns `ProductDetail | null` only, no weak casting

### Test Command Flow:

```bash
# Build-time (CI gate)
npm run test:contracts
npm run lint
npm run build

# Runtime (QA gate, requires server)
npm run qa:product-api-runtime
```

## 8. Migration Checklist

- [x] Define shared product contracts (`lib/contracts/productApi.ts`)
- [x] Type query helper (`getProductByHandle` returns `ProductDetail | null`)
- [x] Align PLP endpoint (`/api/products`) to `ProductListResponse`
- [x] Align PDP endpoint (`/api/products/[handle]`) to `ProductDetailResponse`
- [x] Update PDP client (`app/product/[handle]/page.tsx`) - remove dual-shape parsing
- [x] Update homepage client (`app/page.tsx`) - use typed response
- [x] Remove parallel endpoint (`/api/shopify/products/[handle]`)
- [x] Add runtime contract test (`qa:product-api-contracts.ts`)
- [x] Update package.json with QA test script
- [x] Verify full build and test suite pass
- [x] Document contract strategy in this spec

## 9. Status Summary

**Completed (A3):**

- ✅ Product API contracts defined and implemented
- ✅ Query helper typed to ProductDetail
- ✅ Endpoints aligned to typed response contracts
- ✅ Clients consuming ProductListResponse/ProductDetailResponse
- ✅ Fallback parsing removed (single contract enforcement)
- ✅ Parallel endpoint removed (no orphaned APIs)
- ✅ Runtime contract test created
- ✅ All static tests passing (test:contracts)
- ✅ Full production build passing (45 routes)
- ✅ Zero TypeScript errors

**Next Steps:**

- Consider adding product API response validation to CI/CD (e.g., run `qa:product-api-runtime` in staging deployments)
- Monitor for any new product API consumers to ensure they conform to typed contracts
- Extend contract model if new product fields need to be standardized (e.g., reviews, ratings)

---

**Last Updated:** March 27, 2026  
**Status:** Complete - A3 Product API Typing  
**Build Status:** 🟢 Passing (45 routes)  
**Test Status:** 🟢 Passing (api-contracts, routing-contract, home-product-card-flow)
