# Work Package A13: Shopify Integration Layer for MTM + Booking + Fit

This package binds MTM configuration and fit/booking context into Shopify cart and order metadata for downstream fulfilment and review.

## Purpose

Guarantee that MTM context survives cart, checkout, and order creation in Shopify.

## Scope

1. Add MTM-configured products to Shopify cart.
2. Attach canonical MTM payload to line items.
3. Persist booking and fit references into order context.
4. Preserve downstream fulfilment visibility.

## Deliverables

- `ShopifyMtmCartMapper.ts`
- `ShopifyAddToCartBridge.ts`
- `ShopifyOrderAttributeMapper.ts`
- `POST /api/cart/add-mtm-item`
- Canonical `gjm_*` line item property strategy
- Checkout/order attribute persistence model

## Acceptance Criteria

- MTM cart line contains complete `gjm_*` metadata.
- Booking reference and fit profile reference are preserved.
- Order context can be read later with complete MTM details.
- Checkout handoff preserves design and fit selections.

## Dependencies

- A12 fit handoff
- A14 canonical payload standard

## Status

Implemented in repo with generic ShopifyAddToCartBridge, ShopifyOrderAttributeMapper for MTM context extraction, dedicated POST /api/cart/add-mtm-item endpoint, and regression tests for Shopify mapping schemas. Cart integration uses gjm_* line item attributes for canonical MTM payload persistence through checkout and order creation.
