# Work Package A14: Canonical MTM Payload Standard

This package defines and enforces a versioned MTM payload contract shared by design, fit, booking, commerce, and order systems.

## Purpose

Eliminate payload drift by enforcing one schema across the MTM lifecycle.

## Scope

1. Define canonical schema and validators.
2. Enforce payload versioning.
3. Ensure downstream services consume same payload contract.
4. Add migration guard for future versions.

## Deliverables

- `MtmCanonicalSchema.ts`
- `MtmCanonicalValidator.ts`
- `MtmCanonicalVersion.ts`
- Payload documentation and examples
- Migration guard strategy for version changes

## Acceptance Criteria

- One stable payload contract exists and is referenced platform-wide.
- Design, fit, booking, and commerce all use same schema.
- Payload version is attached to persisted objects.
- Invalid payloads are rejected early with explicit errors.

## Dependencies

- A12 fit handoff
- A13 Shopify mapping layer

## Status

Implemented in repo with versioned canonical MTM payload schemas, Zod validators, version compatibility checking, migration guards, and regression tests. Defines generic MTM contract across design, fit, booking, commerce, and order systems with v1 as current stable version.
