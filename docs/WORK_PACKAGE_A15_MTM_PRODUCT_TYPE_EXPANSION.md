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

Specified and ready for implementation.
