# Work Package A10: Postgres Persistence and Booking Funnel Hardening

This package transitions booking persistence from scaffold JSON stores to Postgres and introduces deployment-grade baseline runbook steps.

## Purpose

Stabilize booking/deposit infrastructure for real environments with durable storage and operational setup.

## Scope

1. Replace JSON stores with Postgres-backed schema and repositories.
2. Persist PaymentIntent and checkout state in durable tables.
3. Seed admin-driven booking reference data.
4. Support secure manage links path (foundation for future A11+ hardening).

## Deliverables

- SQL schema and migration-ready setup (`sql/schema.sql`)
- Seed endpoint:
  - `POST /api/admin/seed` with `x-admin-seed-token`
- Postgres-backed booking and payment persistence
- Local runbook for hold -> confirm -> payment -> webhook -> email/ICS loop

## Acceptance Criteria

- Booking data, payment data, and lifecycle state persist in Postgres.
- Service/staff/rules can be seeded via authenticated admin seed endpoint.
- End-to-end deposit flow survives app restart without state loss.
- Webhook confirmation and post-payment artifacts remain consistent.

## Runtime Requirements

- `DATABASE_URL`
- `ADMIN_SEED_TOKEN`
- Stripe keys
- Optional Resend/Klaviyo keys

## Status

Provided externally as completed package zip (`totr_headless_A10.zip`). Repository integration and validation status should be tracked in implementation PR/commit history.
