# Work Package A9: Stripe Elements Checkout, Webhook Idempotency, and Confirmation Email with ICS

This package upgrades payment UX and hardens webhook processing and customer communications.

## Purpose

Introduce real card payment capture and ensure duplicate webhook deliveries cannot trigger duplicate state transitions.

## Scope

1. Stripe Elements card entry on booking checkout.
2. Payment-required booking gate enforced by webhook confirmation.
3. Idempotent webhook event processing.
4. Confirmation email via Resend with ICS attachment.

## Deliverables

- Stripe Elements UI mounted on `/book/checkout`
- Payment confirmation via `stripe.confirmCardPayment`
- Event deduplication store:
  - `.data/stripe_events.json`
- Confirmation delivery:
  - send via Resend
  - attach `totr-booking-<id>.ics`
  - persist `confirmationEmailSentAt`

## Acceptance Criteria

- Card entry and payment confirmation flow works end-to-end with client secret.
- Bookings with deposits remain `pending_payment` until webhook success.
- Replay/duplicate webhook events do not double-confirm or double-email.
- Successful payment leads to one confirmation email with one ICS attachment.

## Runtime Requirements

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## Status

Provided externally as completed package zip (`totr_headless_A9.zip`). Repository integration and validation status should be tracked in implementation PR/commit history.
