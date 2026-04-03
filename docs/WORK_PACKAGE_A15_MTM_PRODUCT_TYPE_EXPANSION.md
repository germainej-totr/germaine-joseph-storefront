# Work Package A15: MTM Product Type Expansion

This package scales MTM architecture beyond trousers to all required garment categories.

## Purpose

Support a multi-category MTM catalog with consistent configurator, validation, pricing, and payload mapping behavior.

## Scope

1. Add category-specific option sets and controllers.
2. Add category payload mappers and reusable domain utilities.
3. Wire MTM gating across all supported categories.

## Target Categories

- Business suits
- Wedding suits
- Casual suits
- Tuxedos
- Men shirts
- Women shirts
- Blazers
- Overcoats
- Waistcoats / vests

## Deliverables

- Category option model per MTM category
- Category configurator controllers
- Category-specific canonical payload mappers
- Shared MTM domain utilities
- Product gating coverage across all MTM-required categories

## Acceptance Criteria

- Each category has option set, configurator path, validation, pricing, and canonical mapping.
- Saved-fit logic works where applicable by category.
- Category switching does not break payload contract.

## Dependencies

- A14 canonical payload
- A16 fabric platform influences category suitability rules

## Status

Phase implementation in progress and validated in-repo.

Implemented:
- Suit configurator variants: business, wedding, casual, tuxedo
- Dedicated category configurators and routes for:
	- Blazers (`/tailor/blazer`)
	- Shirts (`/tailor/shirt`)
	- Overcoats (`/tailor/overcoat`)
	- Waistcoats (`/tailor/waistcoat`)
- Shared reusable controller: `CategoryConfiguratorController`
- Shared reusable UI: `GenericMtmConfigurator`
- Category option models created in `types/*Options.ts`
- MTM category navigation links surfaced on `/shop`
- Phase 3 handoff and commerce wiring:
	- Category design handoff storage + query handoff to `/configure-fit`
	- Category-aware fit intake handoff resolution
	- Generic MTM cart bridge to `/api/cart/add-mtm-item`
	- Canonical MTM payload and line-item attribute construction for non-trouser categories
	- End-to-end category ordering from configurator -> fit -> cart -> checkout redirect
- Phase 3.1 analytics + regression hardening:
	- Category-specific analytics field mapping for suit, blazer, shirt, overcoat, and waistcoat cart events
	- Shared category cart payload builder extracted for deterministic payload shape
	- Regression tests added for:
		- Category handoff query parsing
		- Generic category cart payload shape
		- Category analytics field derivation
- Phase 3.2 observability smoke gate:
	- Added category funnel smoke script:
		- `scripts/posthog/staging-mtm-funnel-category-smoke.mjs`
	- Added npm command:
		- `npm run qa:mtm-funnel-category-smoke`
	- Script behavior:
		- Posts sample `gjm_mtm_cart_add` and `gjm_mtm_checkout_start` events for suit, blazer, shirt, overcoat, and vest categories
		- Verifies category-specific required analytics fields before posting
		- Supports dry-run validation mode (`--dry-run`) for prelaunch payload checks without network posting

Validation evidence:
- `npm run qa:predeploy` passing (contracts, lint with warnings only, build)
- Build manifest includes new routes:
	- `/tailor/blazer`
	- `/tailor/shirt`
	- `/tailor/overcoat`
	- `/tailor/waistcoat`
	- `/tailor/tuxedo`
