# Work Package A12: Fit Profile and MTM Handoff

This package formalizes fit profile persistence and customer ownership, then links fit output to the canonical MTM commerce payload.

## Purpose

Make fit data durable, customer-owned, reusable, and commerce-ready.

## Scope

1. Fit profile creation and update/versioning.
2. Anatomy/posture/size logic storage and evolution.
3. Saved-fit reuse path.
4. Handoff from fit gate to MTM payload.

## Deliverables

- `FitProfileService.ts`
- `FitProfileRepository.ts`
- `FitProfileSchema.ts`
- `FitProfileSummaryCard.tsx`
- `useFitProfile.ts`
- Fit profile save/update API routes
- Customer-bound fit ownership enforcement

## Acceptance Criteria

- Fit profile can be created from fit flow.
- Saved fit can be reused in checkout path.
- Fit profile ownership is linked to authenticated customer.
- Canonical MTM payload contains fit data.
- Fit versions are distinguishable and recoverable.

## Dependencies

- A5 fit UI baseline
- A23 auth hardening will later strengthen ownership controls further

## Status

Implemented in repo with shared fit schema/repository/service layers, ownership-aware fit profile APIs, account summary UI, reusable fit hook, and corrected fit-profile-to-MTM payload handoff.
