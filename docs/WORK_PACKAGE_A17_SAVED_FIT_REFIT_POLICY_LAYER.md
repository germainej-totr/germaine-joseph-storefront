# Work Package A17: Saved Fit Logic and Refit Policy Layer

This package formalizes policy-driven saved-fit eligibility and refit decisioning.

## Purpose

Replace hardcoded gate logic with auditable policy rules for fit freshness and compatibility.

## Scope

1. Implement fit freshness and body-change policy rules.
2. Enforce forced-refit and saved-fit override paths.
3. Enforce category compatibility constraints.
4. Capture customer confirmation decisions for auditability.

## Deliverables

- `SavedFitPolicy.ts`
- `RefitEligibilityService.ts`
- `BodyChangeConfirmation.tsx`
- Rule engine supporting:
  - profile age less than 6 months
  - profile age 6+ months
  - missing profile
  - ownership mismatch
  - category mismatch

## Acceptance Criteria

- Saved-fit reuse is policy-driven and testable.
- Stale profiles are handled consistently.
- Customer confirmation path is tracked and auditable.
- Compatibility and ownership constraints are enforced before checkout.

## Dependencies

- A12 fit profile ownership/versioning
- A15 category expansion

## Status

Specified and ready for implementation.
