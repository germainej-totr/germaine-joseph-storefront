// app/admin/bookings/page.tsx
import { prisma } from '@/lib/prisma';
import { withPrismaRetry } from '@/lib/prisma-retry';
import BookingsClient from './BookingsClient';
import type { BookingRecord } from './BookingsClient';

// This ensures the page always checks the DB for new bookings
export const dynamic = 'force-dynamic';

export default async function TailorsInboxPage() {
  // 1. Fetch real data securely on the server
  const bookings = await withPrismaRetry<BookingRecord[]>(() =>
    prisma.booking.findMany({
      orderBy: { startAt: 'desc' },
      include: { fitProfile: true }, // Joins the fit data to the booking
    }),
  );

  // 2. Pass that real data into the interactive Client UI
  return <BookingsClient initialBookings={bookings} />;
}