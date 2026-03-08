# Work Package B2: Booking Service Specification

The Booking Service (`BookSvc`) provides backend logic for tailors to offer
appointments, handle deposits, and manage availability. This spec outlines the
behaviour, data structures, and integration points.

## Core Responsibilities

1. **Availability Search**
   - Input: desired date range, service type, location (postcode/coordinates).
   - Output: list of available time slots with staff assignment.
   - Rules:
     * Respect travel zones with radius and flat fee logic
     * Enforce lead time (e.g. bookings must be >=24h in future)
     * Block out existing bookings per staff
     * Optionally allow "any tailor" vs specific tailor

2. **Booking Creation**
   - Accepts customer email, selected slot, address, service type.
   - Creates `Booking` record in Postgres with `status="confirmed"`.
   - Handles optional deposit charging via Stripe/Shopify Payments.
   - Sends confirmation event to Klaviyo ("booking_confirmed").
   - Returns success URL and notification payload.

3. **Modification / Cancellation**
   - Allow updating notes, rescheduling (subject to lead time), or cancelling
     (possibly with refund logic).
   - Emit Klaviyo events (`booking_rescheduled`, `booking_cancelled`).

4. **Reminder & Questionnaire**
   - On the server side, a scheduled job or webhook triggers pre-appointment
     reminders (email/SMS) 24h before.
   - Deliver a pre-appointment questionnaire link (future feature).

5. **Integration with Fit Profiles**
   - When booking created with a new profile, optionally pre-populate
     `FitProfile` fields.
   - Booking may suggest jacket/trouser categories based on site activity.

## Data Model (already present)

- `Booking` table (see Prisma schema) stores all fields.
- Additional indexes:
  - `startAt` for efficient slot search.
  - `location` may be stored as JSON of `{ lat, lng, address }`.

## API Endpoints

These will live under `/app/api/bookings/`:

- `GET /availability` – returns available slots for query parameters.
- `POST /create` – create a booking record and process deposit.
- `PATCH /:id` – update or cancel booking.
- Webhook endpoints for Stripe (optional) and Klaviyo callbacks.

## Implementation Notes

- Use internal `lib/booking-service.ts` to encapsulate logic and reuse server-side
  in both API routes and admin portal.
- Cache availability queries in Redis to minimize computation.
- Use Zod schemas for request validation.

---

Completing this spec provides a clear target for building `/fit/book` UI and
related backend functionality.
