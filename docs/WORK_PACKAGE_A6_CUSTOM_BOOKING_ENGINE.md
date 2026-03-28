# Work Package A6: Custom Booking Engine (No Calendly)

This package introduces first-party booking infrastructure including availability, slot hold, confirmation, and optional fit profile auto-creation.

## Purpose

Deliver an end-to-end internal booking flow under platform control instead of third-party schedulers.

## Scope

1. Booking journey route for service selection, availability, hold, and confirmation.
2. Availability generated from weekly rules, exceptions, and conflict checks.
3. 10-minute hold lifecycle with hold cookie.
4. Booking confirmation path with booking cookie.
5. Optional Klaviyo event hook on confirmation.

## Deliverables

- Route/UI:
  - `/book`
- API endpoints:
  - `GET /api/booking/services`
  - `GET /api/booking/availability`
  - `POST /api/booking/hold`
  - `POST /api/booking/confirm`
- Scaffold data store:
  - `.data/booking.json`
  - services, staff, weekly rules, exceptions, holds, bookings
- Cookies:
  - `totr_hold_id`
  - `totr_booking_id`
- Optional event:
  - Klaviyo "Booking Confirmed"

## Acceptance Criteria

- User can choose service and slot and obtain a valid hold.
- Hold expires after 10 minutes and blocks conflicting reservations.
- Confirmation creates booking and stores booking cookie.
- Availability excludes conflicting confirmed bookings and active holds.
- Klaviyo event sends best-effort when key is present.

## Status

Provided externally as completed package zip (`totr_headless_A6.zip`). Repository integration and validation status should be tracked in implementation PR/commit history.
