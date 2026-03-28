# Work Package A11: Real Reschedule Engine

This package replaces "new booking" style reschedules with in-place booking moves that preserve continuity and auditability.

## Purpose

Support true booking rescheduling without changing booking identity.

## Scope

1. Move existing booking to new date/time.
2. Conflict checks against confirmed bookings, active holds, staff rules, and date exceptions.
3. Preserve booking ID and release old slot.
4. Reissue updated ICS and confirmation email.

## Deliverables

- `RescheduleBookingService.ts`
- `GET /api/booking/reschedule/availability`
- `POST /api/booking/reschedule`
- Updated reschedule management UI under booking manage flow
- ICS regeneration logic
- Confirmation resend logic for successful reschedule

## Acceptance Criteria

- Reschedule changes booking time in place and preserves booking ID.
- Reschedule is conflict-safe against booking and hold constraints.
- Old slot is released after successful move.
- Updated ICS reflects new schedule.
- Updated confirmation email is sent.
- Audit-safe continuity is preserved for booking history.

## Dependencies

- A10 Postgres booking persistence
- A8/A9 webhook and confirmation lifecycle baseline

## Status

Specified and ready for implementation.
