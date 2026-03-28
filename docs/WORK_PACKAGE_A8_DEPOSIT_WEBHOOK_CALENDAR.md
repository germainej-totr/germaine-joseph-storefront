# Work Package A8: Deposit Checkout Handoff, Stripe Webhook Confirmation, and ICS

This package closes the payment-to-booking confirmation loop and introduces calendar invite generation.

## Purpose

Move booking deposits from scaffold behavior to webhook-driven confirmation with calendar artifact output.

## Scope

1. Deposit-required flow routes booking to checkout path.
2. PaymentIntent creation and persistence for booking.
3. Stripe webhook verification and confirmation handling.
4. ICS generation endpoint for appointment download.

## Deliverables

- Route/UI:
  - `/book/checkout?bookingId=...`
- API endpoints:
  - `POST /api/booking/pay`
  - `POST /api/stripe/webhook`
  - `GET /api/booking/ics?bookingId=...`
- Webhook processing:
  - verify `Stripe-Signature`
  - handle `payment_intent.succeeded`
  - update booking to confirmed
  - optional Klaviyo "Booking Deposit Paid"

## Acceptance Criteria

- Deposit-required booking enters `pending_payment` then confirms only after webhook success.
- Invalid webhook signatures are rejected.
- Booking confirmation update is linked to metadata `bookingId`.
- ICS endpoint returns valid downloadable event file.

## Runtime Requirements

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Status

Provided externally as completed package zip (`totr_headless_A8.zip`). Repository integration and validation status should be tracked in implementation PR/commit history.
