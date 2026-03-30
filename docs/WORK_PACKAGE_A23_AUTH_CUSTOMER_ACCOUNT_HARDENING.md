# Work Package A23: Auth and Customer Account Hardening

This package strengthens identity and ownership controls across MTM and booking flows.

## Purpose

Ensure MTM and booking actions are customer-safe, ownership-enforced, and account-linked.

## Scope

1. Harden session/customer identity handling.
2. Enforce authenticated fit ownership.
3. Link order history to account and fit context.
4. Protect reschedule/cancel/manage actions.

## Deliverables

- Stronger session and customer identity enforcement
- Fit profile ownership hardening across APIs and UI flows
- Account-linked MTM history model
- Protected management action framework

## Acceptance Criteria

- MTM data is isolated to rightful customer identity.
- Saved-fit reuse cannot cross customers.
- Account history is reusable and trustworthy.
- Manage actions require secure ownership/authorization checks.

## Dependencies

- A12 fit ownership baseline
- A11 manage action workflows

## Status

Partially implemented in repo with customer-account ownership hardening primitives:

- Signed booking manage tokens added for customer-safe booking action links.
- Booking ICS download now enforces ownership via signed manage token or active session.
- Booking confirm/reschedule APIs now emit manage tokens/URLs for downstream secure actions.
- Booking reschedule/manage endpoints now support optional token-backed ownership checks (activated when manage token is supplied).
- Account-linked history service/API/UI added to expose owned bookings and MTM production specs.

Remaining hardening scope (future increment):

- Apply equivalent ownership gates to all booking mutate/read endpoints used in customer self-service.
- Add explicit admin/staff authorization boundary for internal booking mutation tools.
