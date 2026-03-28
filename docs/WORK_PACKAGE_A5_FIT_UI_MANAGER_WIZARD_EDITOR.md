# Work Package A5: Fit UI Manager, Smart Fit Wizard, and Measurement Editor

This package upgrades A4 scaffolding into a practical fit management experience with profile lifecycle and versioned measurements.

## Purpose

Replace placeholder fit handling with a full customer-facing fit profile management and editing flow.

## Scope

1. Fit Profile Manager page and profile cards.
2. Smart Fit Wizard flow for profile bootstrap.
3. Measurement editor with categories, validation, and history.
4. Expanded fit APIs for default selection, rename, delete.
5. Upgraded PDP fit gate with profile picker and smart fit flow.

## Deliverables

- Routes/UI:
  - `/fit` profile manager
  - `/fit/new` smart fit wizard
  - `/fit/[id]` measurement editor
- Measurement editor:
  - category tabs
  - field validation and range checks
  - versioned set saving and history visibility
- API endpoints:
  - `POST /api/fit/default`
  - `PATCH /api/fit/:id`
  - `DELETE /api/fit/:id`
- PDP fit gate capabilities:
  - choose existing profile
  - create profile
  - launch smart fit
  - booking action stub for A6

## Acceptance Criteria

- Customer can create, rename, delete, and set default fit profile.
- Smart fit can create baseline measurement set and route to editor.
- Measurement sets are versioned and visible in profile history.
- PDP gate returns usable `fit_profile_id` to MTM cart path.
- Default fit cookie is set through API and reused on next flows.

## Status

Provided externally as completed package zip (`totr_headless_A5.zip`). Repository integration and validation status should be tracked in implementation PR/commit history.
