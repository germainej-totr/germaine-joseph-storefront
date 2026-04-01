# Work Package A4: Fit Profile Service, Fit API, and PDP Fit Gate

This package establishes the first complete Fit Profile capability used by MTM gating on PDP and server-side add-to-cart enforcement.

## Purpose

Create the foundational fit profile flow so MTM-required products cannot proceed to checkout without fit context.

## Scope

1. Fit profile data service using local JSON scaffold store.
2. Fit API routes for profile list/create/read/update.
3. Fit Gate modal on PDP for MTM-required products.
4. Server-side FIT_REQUIRED enforcement on add-to-cart.
5. Cart session cookie creation and persistence.

## Deliverables

- Fit profile local store: `.data/fit.json`
- Types: `FitProfile`, `MeasurementSet`
- API endpoints:
  - `GET /api/fit`
  - `POST /api/fit`
  - `GET /api/fit/:id`
  - `PUT /api/fit/:id`
- PDP fit gate modal for MTM-required products
- Server enforcement:
  - `POST /api/shopify/cart` addLine checks variant/product metafield
  - Returns `400` with `code: "FIT_REQUIRED"` if missing fit profile
- Cookie handling:
  - `totr_cart_id`

## Acceptance Criteria

- MTM-required PDP path prompts fit gate before cart add.
- Creating fit profile from modal enables MTM add-to-cart.
- Server rejects MTM cart add when `fit_profile_id` is missing.
- Cart is auto-created and `totr_cart_id` cookie is set when absent.
- User can complete PDP -> cart -> checkout handoff after fit profile selection.

## Runtime Requirements

- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- `NEXT_PUBLIC_SITE_URL`

## Status

Integrated and validated in-repo.

Latest closeout includes:

- Compatibility aliases for fit API endpoints (`/api/fit`, `/api/fit/[id]`) while preserving existing profile routes.
- Server-side `FIT_REQUIRED` enforcement in cart add flow by evaluating Shopify variant/product fit-gate metafield.
- Cart cookie compatibility for both `totr_cart_id` (primary) and `shopify_cart_id` (legacy fallback).

Validation evidence:

- `npm run qa:predeploy` passes (Prisma connectivity, contracts, lint with warnings only, build).
- `qa-launch-readiness` passes with production route checks.
