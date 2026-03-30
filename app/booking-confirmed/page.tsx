'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Calendar, Mail, Scissors, Download, Share2, ChevronRight } from 'lucide-react';
import { useBookingServiceTypes } from '@/hooks/useBookingServiceTypes';
import type { ServiceTypeId } from '@/types/booking';
import { buildIcsEventContent } from '@/lib/booking/calendar';

function parseServiceType(value: string | null): ServiceTypeId {
  if (
    value === 'showroom' ||
    value === 'home_office' ||
    value === 'tailor_fitting' ||
    value === 'virtual' ||
    value === 'video_consult'
  ) {
    return value;
  }

  return 'showroom';
}

function updateQuery(params: Record<string, string | null>) {
  const next = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim()) {
      next.searchParams.set(key, value);
    } else {
      next.searchParams.delete(key);
    }
  }

  window.history.replaceState({}, '', `${next.pathname}?${next.searchParams.toString()}`);
}

function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const initialTime = searchParams.get('time') || '09:00 AM';
  const initialDate = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const initialServiceType = parseServiceType(searchParams.get('serviceType'));
  const bookingId = searchParams.get('bookingId') || '';
  const bookingEmail = searchParams.get('email') || '';
  const isWedding = (searchParams.get('useCase') || 'Business') === 'Wedding';
  const { serviceTypeMap, serviceTypes } = useBookingServiceTypes();

  const [activeTime, setActiveTime] = useState(initialTime);
  const [activeDate, setActiveDate] = useState(initialDate);
  const [activeServiceType, setActiveServiceType] = useState<ServiceTypeId>(initialServiceType);
  const [manageToken, setManageToken] = useState(searchParams.get('manageToken') || '');
  const [rescheduleDate, setRescheduleDate] = useState(initialDate);
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState(initialTime);
  const [rescheduleServiceType, setRescheduleServiceType] = useState<ServiceTypeId>(initialServiceType);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [manageError, setManageError] = useState('');
  const [manageSuccess, setManageSuccess] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmittingManage, setIsSubmittingManage] = useState(false);

  const selectedService = serviceTypeMap[activeServiceType];
  const selectedManageService = serviceTypeMap[rescheduleServiceType];
  const canManageBooking = Boolean(bookingId);

  useEffect(() => {
    if (!bookingId || !rescheduleDate) {
      setAvailableSlots([]);
      return;
    }

    let cancelled = false;

    async function loadAvailability() {
      try {
        setIsLoadingSlots(true);
        setManageError('');

        const query = new URLSearchParams({
          bookingId,
          date: rescheduleDate,
          serviceType: rescheduleServiceType,
        });
        if (manageToken) {
          query.set('manageToken', manageToken);
        }

        const response = await fetch(`/api/bookings/reschedule/availability?${query.toString()}`, {
          cache: 'no-store',
        });
        const payload = await response.json();

        if (cancelled) return;
        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Failed to load availability');
        }

        const nextSlots = Array.isArray(payload.availableSlots) ? payload.availableSlots : [];
        setAvailableSlots(nextSlots);
        setRescheduleTimeSlot((previous) => (nextSlots.includes(previous) ? previous : nextSlots[0] || ''));
      } catch (error) {
        if (cancelled) return;
        setAvailableSlots([]);
        setManageError(error instanceof Error ? error.message : 'Failed to load availability');
      } finally {
        if (!cancelled) {
          setIsLoadingSlots(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [bookingId, manageToken, rescheduleDate, rescheduleServiceType]);

  const downloadICS = () => {
    if (bookingId) {
      const url = new URL('/api/bookings/ics', window.location.origin);
      url.searchParams.set('bookingId', bookingId);
      if (manageToken) {
        url.searchParams.set('manageToken', manageToken);
      }
      window.location.href = `${url.pathname}?${url.searchParams.toString()}`;
      return;
    }

    const title = 'Fitting: Germaine Joseph Bespoke';
    const durationMin = serviceTypeMap[activeServiceType]?.durationMin ?? 60;
    const icsContent = buildIcsEventContent({
      title,
      date: activeDate,
      timeSlot: activeTime,
      durationMin,
      location: 'Maison Showroom',
      description: `Service: ${serviceTypeMap[activeServiceType]?.label || activeServiceType}`,
    });

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'maison-appointment.ics');
    link.click();
  };

  const handleShare = async () => {
    const shareData = {
      title: isWedding ? 'Maison Appointment: Wedding Profile' : 'Maison Appointment: Technical Specs',
      text: isWedding
        ? "I've finalized my wedding suit profile at Germaine Joseph. View the details here:"
        : 'My bespoke measurement profile and technical specifications from Germaine Joseph:',
      url: `${window.location.origin}/share/profile?email=${encodeURIComponent(bookingEmail)}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert('Profile link copied to clipboard');
    }
  };

  async function submitReschedule() {
    if (!bookingId || !rescheduleDate || !rescheduleTimeSlot) {
      setManageError('Date and time slot are required.');
      return;
    }

    try {
      setIsSubmittingManage(true);
      setManageError('');
      setManageSuccess('');

      const response = await fetch('/api/bookings/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          date: rescheduleDate,
          timeSlot: rescheduleTimeSlot,
          serviceType: rescheduleServiceType,
          manageToken: manageToken || undefined,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to reschedule booking');
      }

      const nextDate = payload.current?.date || rescheduleDate;
      const nextTime = payload.current?.timeSlot || rescheduleTimeSlot;
      const nextServiceType = parseServiceType(payload.current?.serviceType || rescheduleServiceType);
      const nextToken = typeof payload.manageToken === 'string' && payload.manageToken ? payload.manageToken : manageToken;

      setActiveDate(nextDate);
      setActiveTime(nextTime);
      setActiveServiceType(nextServiceType);
      setRescheduleDate(nextDate);
      setRescheduleTimeSlot(nextTime);
      setRescheduleServiceType(nextServiceType);
      setManageToken(nextToken);
      setManageSuccess('Appointment rescheduled successfully.');
      updateQuery({
        date: nextDate,
        time: nextTime,
        serviceType: nextServiceType,
        manageToken: nextToken,
      });
    } catch (error) {
      setManageError(error instanceof Error ? error.message : 'Failed to reschedule booking');
    } finally {
      setIsSubmittingManage(false);
    }
  }

  async function cancelBooking() {
    if (!bookingId) {
      return;
    }

    try {
      setIsSubmittingManage(true);
      setManageError('');
      setManageSuccess('');

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          manageToken: manageToken || undefined,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to cancel booking');
      }

      setManageSuccess('Appointment cancelled successfully.');
    } catch (error) {
      setManageError(error instanceof Error ? error.message : 'Failed to cancel booking');
    } finally {
      setIsSubmittingManage(false);
    }
  }

  const manageSummary = useMemo(() => {
    if (!selectedService?.label) {
      return activeServiceType;
    }

    return selectedService.label;
  }, [activeServiceType, selectedService]);

  return (
    <div className="min-h-[100dvh] bg-[#FDFDFD] flex flex-col md:items-center md:justify-center p-0 md:p-4 text-black font-sans">
      <div className="flex-1 md:flex-initial w-full max-w-xl bg-white md:border md:border-zinc-100 md:shadow-2xl md:rounded-2xl overflow-hidden flex flex-col animate-in fade-in duration-700">
        <div className="bg-black pt-16 pb-12 px-8 text-center text-white relative">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-full mb-6 border border-white/10 backdrop-blur-sm">
            <Check size={40} className="text-white" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-2xl md:text-3xl tracking-[0.2em] uppercase mb-2">Profile Secured</h1>
          <div className="inline-block px-4 py-1 border border-white/20 rounded-full">
            <p className="text-zinc-400 text-[9px] tracking-[0.2em] uppercase font-bold">{activeTime} Appointment</p>
          </div>
        </div>

        <div className="p-8 pb-4 space-y-4">
          <h2 className="font-serif text-lg tracking-tight border-b pb-4 border-zinc-100 italic">Logistics Hub</h2>

          <button onClick={downloadICS} className="w-full flex items-center justify-between p-5 bg-zinc-50 rounded-2xl border border-zinc-100 active:scale-[0.98] transition-all">
            <div className="flex gap-4 items-center">
              <div className="bg-black text-white p-2 rounded-lg"><Calendar size={18} /></div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase text-zinc-400">Add to Schedule</p>
                <p className="text-sm font-medium">Sync to iCal / Google</p>
              </div>
            </div>
            <Download size={16} className="text-zinc-300" />
          </button>

          <button onClick={handleShare} className="w-full flex items-center justify-between p-5 bg-white rounded-2xl border border-zinc-100 active:scale-[0.98] shadow-sm transition-all">
            <div className="flex gap-4 items-center">
              <div className="bg-zinc-100 text-black p-2 rounded-lg"><Share2 size={18} /></div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase text-zinc-400">
                  {isWedding ? 'Wedding Coordination' : 'Documentation'}
                </p>
                <p className="text-sm font-medium">
                  {isWedding ? 'Share with Partner' : 'Export Specifications'}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-zinc-300" />
          </button>
        </div>

        {canManageBooking ? (
          <div className="px-8 py-2 space-y-4">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">Manage appointment</h2>
                  <p className="mt-1 text-sm text-zinc-500">Booking {bookingId.slice(0, 8)} • {manageSummary}</p>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                  {manageToken ? 'secured link' : 'session access'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm text-zinc-700">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-zinc-400">New date</span>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(event) => setRescheduleDate(event.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  />
                </label>

                <label className="text-sm text-zinc-700">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-zinc-400">Service type</span>
                  <select
                    value={rescheduleServiceType}
                    onChange={(event) => setRescheduleServiceType(parseServiceType(event.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  >
                    {serviceTypes.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-3 block text-sm text-zinc-700">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-zinc-400">Available time</span>
                <select
                  value={rescheduleTimeSlot}
                  onChange={(event) => setRescheduleTimeSlot(event.target.value)}
                  disabled={isLoadingSlots || availableSlots.length === 0}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:bg-zinc-100"
                >
                  <option value="">{isLoadingSlots ? 'Loading slots...' : 'Select time'}</option>
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </label>

              {selectedManageService?.leadTimeHours ? (
                <p className="mt-2 text-xs text-zinc-500">Lead time: {selectedManageService.leadTimeHours} hours</p>
              ) : null}

              {manageError ? <p className="mt-3 text-sm text-red-600">{manageError}</p> : null}
              {manageSuccess ? <p className="mt-3 text-sm text-emerald-700">{manageSuccess}</p> : null}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={submitReschedule}
                  disabled={isSubmittingManage || isLoadingSlots || !rescheduleTimeSlot}
                  className="flex-1 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:bg-zinc-300"
                >
                  {isSubmittingManage ? 'Updating...' : 'Reschedule appointment'}
                </button>
                <button
                  type="button"
                  onClick={cancelBooking}
                  disabled={isSubmittingManage}
                  className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:text-zinc-400"
                >
                  Cancel booking
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="px-8 py-6 space-y-8">
          <div className="flex gap-5 items-start p-2">
            <Mail size={20} className="text-zinc-300 shrink-0" />
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Digital Pattern Review</h4>
              <p className="text-sm text-zinc-500 mt-1">A detailed summary has been dispatched to your email for your records.</p>
            </div>
          </div>

          <div className="flex gap-5 items-start p-2">
            <Scissors size={20} className="text-zinc-300 shrink-0" />
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Master Tailor Review</h4>
              <p className="text-sm text-zinc-500 mt-1">Our technical team is reviewing your build notes to prepare the exact blocks for your fitting.</p>
            </div>
          </div>
        </div>

        <div className="p-8 pt-4 pb-12">
          <Link href="/" className="w-full flex items-center justify-center bg-black text-white py-5 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl active:scale-[0.98] transition-transform">
            Return to Maison
          </Link>
          <p className="text-[9px] text-zinc-300 text-center mt-6 uppercase tracking-widest">Est. 2026 | Germaine Joseph</p>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmed() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <BookingConfirmedContent />
    </Suspense>
  );
}