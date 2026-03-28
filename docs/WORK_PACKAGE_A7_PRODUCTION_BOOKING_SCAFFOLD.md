# Work Package A7: Production-Grade Booking Scaffolding

This package extends booking to support mode-aware operations, multi-staff scheduling, hold countdown behavior, and initial deposit scaffolding.

## Purpose

Harden booking behavior toward production requirements while preserving iterative rollout.

## Scope

1. Mobile versus studio routing and filtering.
2. Multi-staff selection and availability rules.
3. Hold countdown with release and expiry semantics.
4. Optional deposit scaffolding through Stripe PaymentIntent creation.

## Deliverables

- Booking mode selector and location object capture
- API endpoints:
  - `GET /api/booking/staff?mode=mobile|studio`
  - `DELETE /api/booking/hold/:id`
  - `POST /api/booking/pay`
- Hold status model:
  - `active`
  - `released`
  - `expired`
- Booking statuses include `pending_payment` for deposit-required services

## Acceptance Criteria

- Services and staff are filtered correctly by selected mode.
- Slot conflicts respect hold and confirmed booking constraints.
- Client countdown aligns with `expiresAt` and auto-release behavior.
- Re-selecting service/staff/slot releases prior hold.
- Deposit-required services produce pending payment state and PaymentIntent scaffold.

## Status

Provided externally as completed package zip (`totr_headless_A7.zip`). Repository integration and validation status should be tracked in implementation PR/commit history.
