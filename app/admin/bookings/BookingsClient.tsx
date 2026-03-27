'use client';

import { useMemo, useState } from 'react';
import { calculateFitConfidence } from '@/lib/fit-logic';
import RescheduleBookingModal, {
  type RescheduleBookingModalState,
  type RescheduleBookingResult,
} from '@/components/admin/RescheduleBookingModal';
import { useBookingServiceTypes } from '@/hooks/useBookingServiceTypes';

interface BookingRecord {
  id: string;
  email: string;
  serviceType?: string;
  startAt: string | Date;
  status?: string;
  location?: unknown;
  fitProfile?: Record<string, unknown> | null;
}

interface BookingsClientProps {
  initialBookings: BookingRecord[];
}

function parseAddress(location: unknown): string {
  if (!location || typeof location !== 'object') {
    return 'Unknown location';
  }

  const parsed = location as { address?: unknown; city?: unknown };
  if (typeof parsed.address === 'string' && parsed.address.trim()) {
    return parsed.address;
  }
  if (typeof parsed.city === 'string' && parsed.city.trim()) {
    return parsed.city;
  }

  return 'Unknown location';
}

function toDateInputValue(value: string | Date): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toISOString().slice(0, 10);
}

function toTimeSlotValue(value: string | Date): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return '';
  }

  const hours = d.getUTCHours();
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${meridiem}`;
}

export default function BookingsClient({ initialBookings }: BookingsClientProps) {
  const [bookings, setBookings] = useState<BookingRecord[]>(initialBookings);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const [rescheduleState, setRescheduleState] = useState<RescheduleBookingModalState | null>(null);
  const { serviceTypes, serviceTypeMap } = useBookingServiceTypes();

  const totalCount = useMemo(() => bookings.length, [bookings.length]);
  async function cancelBooking(bookingId: string) {
    const confirmed = window.confirm('Cancel this booking? This action can be reversed by rescheduling later.');
    if (!confirmed) return;

    setBusyBookingId(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to cancel booking');
      }

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel booking';
      window.alert(message);
    } finally {
      setBusyBookingId(null);
    }
  }

  function openRescheduleModal(booking: BookingRecord) {
    setRescheduleState({
      bookingId: booking.id,
      initialDate: toDateInputValue(booking.startAt),
      initialTimeSlot: toTimeSlotValue(booking.startAt),
      initialServiceType: booking.serviceType || 'showroom',
    });
  }

  function handleRescheduled(result: RescheduleBookingResult) {
    setBookings((previous) =>
      previous.map((booking) => {
        if (booking.id !== result.bookingId) return booking;
        return {
          ...booking,
          startAt: result.startAtIso || booking.startAt,
          serviceType: result.serviceType,
          status: 'confirmed',
        };
      }),
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-serif text-zinc-900">Tailor&apos;s Inbox</h1>
            <p className="text-zinc-500 mt-2 text-sm uppercase tracking-widest font-medium">
              Live Database: Germaine Joseph
            </p>
          </div>
          <div className="text-right">
            <span className="block text-2xl font-mono font-bold text-zinc-900">{totalCount}</span>
            <span className="text-[10px] text-zinc-400 uppercase font-bold">Total Appointments</span>
          </div>
        </header>

        <div className="bg-white rounded-[2rem] shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Client / Email</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Service</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date/Time</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Fit Confidence</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {bookings.map((booking) => {
                const confidence = booking.fitProfile ? calculateFitConfidence(booking.fitProfile) : 0;
                const address = parseAddress(booking.location);
                const isCancelled = (booking.status || '').toLowerCase() === 'cancelled';
                const isBusy = busyBookingId === booking.id;

                return (
                  <tr key={booking.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-bold text-zinc-900">{booking.email}</div>
                      <div className="text-[10px] font-mono text-zinc-400">ID: {booking.id.substring(0, 8)}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-medium text-zinc-800">
                        {serviceTypeMap[booking.serviceType || '']?.label || booking.serviceType}
                      </div>
                      <div className="text-xs text-zinc-500">{address}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-medium text-zinc-800">
                        {new Date(booking.startAt).toLocaleDateString('en-AU')}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Date(booking.startAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${
                          isCancelled ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {booking.status || 'confirmed'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          confidence > 80 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {confidence > 0 ? `${confidence}%` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          disabled={isBusy || isCancelled}
                          onClick={() => openRescheduleModal(booking)}
                          className="text-xs font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-black disabled:cursor-not-allowed disabled:text-zinc-300"
                        >
                          {isBusy ? 'Working...' : 'Reschedule'}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy || isCancelled}
                          onClick={() => void cancelBooking(booking.id)}
                          className="text-xs font-bold uppercase tracking-widest text-rose-500 transition-colors hover:text-rose-700 disabled:cursor-not-allowed disabled:text-zinc-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <div className="p-20 text-center text-zinc-400 italic">No bookings found in the database.</div>
          )}
        </div>

        <RescheduleBookingModal
          isOpen={Boolean(rescheduleState)}
          state={rescheduleState}
          serviceTypes={serviceTypes}
          onClose={() => setRescheduleState(null)}
          onRescheduled={handleRescheduled}
        />
      </div>
    </div>
  );
}
