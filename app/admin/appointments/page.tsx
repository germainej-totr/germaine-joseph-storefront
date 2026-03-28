'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RescheduleBookingModal, {
  type RescheduleBookingModalState,
  type RescheduleBookingResult,
} from '@/components/admin/RescheduleBookingModal';
import { useBookingServiceTypes } from '@/hooks/useBookingServiceTypes';

interface BookingViewModel {
  id: string;
  email: string;
  status?: string;
  technicalSpecs?: Record<string, unknown> & {
    attributes?: Record<string, string>;
    preferences?: Record<string, string>;
  };
  appointmentDate?: string;
  appointmentTime?: string;
  fitPreference?: string;
  jacketSize?: string;
  trouserSize?: string;
  serviceType?: string;
}

function toDateInputValue(value?: string): string {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toISOString().slice(0, 10);
}

export default function AppointmentsPage() {
  const [bookings, setBookings] = useState<BookingViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const [rescheduleState, setRescheduleState] = useState<RescheduleBookingModalState | null>(null);
  const { serviceTypes, serviceTypeMap } = useBookingServiceTypes();

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      setLoading(true);
      setLoadError(null);

      const maxAttempts = 3;
      let lastError = 'Failed to load bookings';

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const res = await fetch('/api/admin/get-bookings', { cache: 'no-store' });
          const data = await res.json();

          if (!res.ok) {
            throw new Error(
              (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
                ? data.error
                : null) ||
                (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
                  ? data.message
                  : null) ||
                'Failed to load bookings',
            );
          }

          if (!cancelled) {
            setBookings(Array.isArray(data) ? (data as BookingViewModel[]) : []);
            setLoadError(null);
            setLoading(false);
          }
          return;
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Failed to load bookings';
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
            continue;
          }
        }
      }

      if (!cancelled) {
        setBookings([]);
        setLoadError(lastError);
        setLoading(false);
      }
    }

    void loadBookings();

    return () => {
      cancelled = true;
    };
  }, []);

  async function cancelBooking(bookingId: string) {
    const confirmed = window.confirm('Cancel this booking?');
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

  function openRescheduleModal(booking: BookingViewModel) {
    setRescheduleState({
      bookingId: booking.id,
      initialDate: toDateInputValue(booking.appointmentDate),
      initialTimeSlot: booking.appointmentTime || '',
      initialServiceType: booking.serviceType || 'showroom',
    });
  }

  function handleRescheduled(result: RescheduleBookingResult) {
    setBookings((previous) =>
      previous.map((booking) => {
        if (booking.id !== result.bookingId) return booking;
        return {
          ...booking,
          appointmentDate: result.date,
          appointmentTime: result.timeSlot,
          serviceType: result.serviceType,
          status: 'confirmed',
        };
      }),
    );
  }

  if (loading) {
    return <div className="p-10 text-center font-mono text-gray-400 italic">LOADING MAISON DATABASE...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-8 font-sans text-gray-900">
      <h1 className="text-3xl font-light tracking-tighter mb-10 uppercase border-b pb-4">Maison Intake</h1>

      {loadError && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Unable to load latest bookings: {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {bookings.map((booking) => {
          const specs = booking.technicalSpecs || {};
          const attrs =
            (specs.attributes && typeof specs.attributes === 'object'
              ? (specs.attributes as Record<string, string>)
              : (specs as Record<string, string>)) || {};
          const prefs = specs.preferences || {};
          const isExpanded = expandedId === booking.id;
          const isCancelled = (booking.status || '').toLowerCase() === 'cancelled';
          const isBusy = busyBookingId === booking.id;

          const appointmentDate =
            [booking.appointmentDate, booking.appointmentTime].filter(Boolean).join(' @ ') || 'PENDING SCHEDULE';

          return (
            <div key={booking.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="p-6 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : booking.id)}>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{booking.email}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] text-gray-400 font-mono tracking-tighter">REF: {booking.id.toUpperCase()}</p>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        {appointmentDate}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isCancelled ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {booking.status || 'confirmed'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-2xl text-gray-300 leading-none">{isExpanded ? '−' : '+'}</span>
                    <span className="px-3 py-1 bg-black text-white text-[10px] uppercase tracking-[0.2em] rounded-full font-bold">
                      {booking.fitPreference || prefs.fitType || 'NOT DEFINED'}
                    </span>
                    <Link
                      href={`/admin/fitting/${booking.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1 bg-emerald-700 text-white text-[10px] uppercase tracking-[0.2em] rounded-full font-bold hover:bg-emerald-800 transition-colors"
                    >
                      Tailor File →
                    </Link>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isBusy || isCancelled}
                        onClick={(e) => {
                          e.stopPropagation();
                          openRescheduleModal(booking);
                        }}
                        className="px-3 py-1 bg-zinc-100 text-zinc-700 text-[10px] uppercase tracking-[0.2em] rounded-full font-bold hover:bg-zinc-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusy ? 'Working...' : 'Reschedule'}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy || isCancelled}
                        onClick={(e) => {
                          e.stopPropagation();
                          void cancelBooking(booking.id);
                        }}
                        className="px-3 py-1 bg-rose-50 text-rose-700 text-[10px] uppercase tracking-[0.2em] rounded-full font-bold hover:bg-rose-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-6">
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Jacket / Trouser</p>
                    <p className="text-lg font-medium italic">J{booking.jacketSize || '—'} / T{booking.trouserSize || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Chest / Waist</p>
                    <p className="text-lg font-medium">{attrs.chest || '—'} / {attrs.waist || '—'}<span className="text-xs ml-1 text-gray-400">cm</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Stomach / Hips</p>
                    <p className="text-lg font-medium">{attrs.stomach || '—'} / {attrs.hips || '—'}<span className="text-xs ml-1 text-gray-400">cm</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Service Type</p>
                    <p className="text-lg font-medium">{serviceTypeMap[booking.serviceType || '']?.label || booking.serviceType || 'Fitting'}</p>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-gray-50 border-t border-gray-200 p-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-5">Workshop Anatomy</h3>
                      <div className="space-y-3 bg-white p-5 rounded-lg border border-gray-100 font-medium">
                        {[
                          { label: 'Body Build', val: attrs.bodyBuild },
                          { label: 'Standing Posture', val: attrs.standingPosture },
                          { label: 'Chest Profile', val: attrs.chestProfile },
                          { label: 'Stomach Profile', val: attrs.stomachProfile },
                          { label: 'Seat Shape', val: attrs.seatShape },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-sm text-gray-500 font-normal">{item.label}</span>
                            <span className={`text-sm ${item.val ? 'text-gray-900 font-bold' : 'text-gray-300 italic'}`}>
                              {item.val || 'Data Missing from Form'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-5">Project Scope</h3>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded border border-gray-100">
                            <p className="text-[10px] uppercase text-gray-400 font-bold mb-1 tracking-widest">Use Case</p>
                            <p className={`text-sm font-bold ${(attrs.useCase || prefs.primaryUseCase) ? 'text-gray-900' : 'text-gray-300 italic'}`}>
                              {attrs.useCase || prefs.primaryUseCase || 'Not Captured'}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded border border-gray-100">
                            <p className="text-[10px] uppercase text-gray-400 font-bold mb-1 tracking-widest">Timeline</p>
                            <p className={`text-sm font-bold ${(attrs.timeline || prefs.productionTimeline) ? 'text-blue-700' : 'text-gray-300 italic'}`}>
                              {attrs.timeline || prefs.productionTimeline || 'Not Captured'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white p-5 rounded-lg border-l-4 border-l-black border border-gray-100 shadow-sm">
                          <p className="text-[10px] uppercase text-gray-400 font-black mb-2 tracking-widest">Tailor Alerts / Notes</p>
                          <p className="text-sm text-gray-700 font-medium leading-relaxed italic">
                            {attrs.notes ? `"${attrs.notes}"` : 'No specific tailor alerts provided.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <RescheduleBookingModal
        isOpen={Boolean(rescheduleState)}
        state={rescheduleState}
        serviceTypes={serviceTypes}
        onClose={() => setRescheduleState(null)}
        onRescheduled={handleRescheduled}
      />
    </div>
  );
}
