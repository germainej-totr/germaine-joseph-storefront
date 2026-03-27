'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ServiceTypeId } from '@/types/booking';
import { useBookingServiceTypes } from '@/hooks/useBookingServiceTypes';

function toYyyyMmDdLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMinBookingDateByLeadTime(leadTimeHours: number): string {
  const date = new Date(Date.now() + leadTimeHours * 60 * 60 * 1000);
  return toYyyyMmDdLocal(date);
}

function BookFitContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [serviceType, setServiceType] = useState<ServiceTypeId>('showroom');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [notes, setNotes] = useState('');

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { serviceTypes, serviceTypeMap, defaultServiceType } = useBookingServiceTypes();

  const useCase = searchParams.get('useCase') || 'Business';

  useEffect(() => {
    setServiceType((current) => {
      if (serviceTypeMap[current]) {
        return current;
      }

      return (defaultServiceType as ServiceTypeId) || 'showroom';
    });
  }, [serviceTypeMap, defaultServiceType]);

  useEffect(() => {
    if (!date) {
      setAvailableSlots([]);
      setTimeSlot('');
      return;
    }

    let cancelled = false;

    async function loadAvailability() {
      try {
        setIsCheckingAvailability(true);
        setError('');

        const response = await fetch('/api/bookings/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, serviceType }),
        });

        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load availability');
        }

        const nextSlots: string[] = data.availableSlots || [];
        setAvailableSlots(nextSlots);
        setTimeSlot((previous) => (nextSlots.includes(previous) ? previous : ''));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load availability');
        setAvailableSlots([]);
      } finally {
        if (!cancelled) setIsCheckingAvailability(false);
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [date, serviceType]);

  const selectedServiceType = useMemo(
    () => serviceTypeMap[serviceType],
    [serviceType, serviceTypeMap],
  );

  const minBookingDate = useMemo(
    () => getMinBookingDateByLeadTime(selectedServiceType?.leadTimeHours ?? 24),
    [selectedServiceType],
  );

  const requiresAddress = useMemo(
    () => selectedServiceType?.travelRequired ?? serviceType === 'home_office',
    [selectedServiceType, serviceType],
  );

  async function submitBooking() {
    if (!email || !date || !timeSlot) {
      setError('Please complete email, date, and time slot.');
      return;
    }

    if (requiresAddress && !location.trim()) {
      setError('Address is required for travel-based fittings.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch('/api/bookings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          location: location.trim() || 'Maison Showroom',
          date,
          timeSlot,
          customerEmail: email,
          notes,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to confirm booking');
      }

      const params = new URLSearchParams({
        time: timeSlot,
        date,
        email,
        useCase,
        serviceType,
      });
      window.location.href = `/booking-confirmed?${params.toString()}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm booking');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] px-4 py-10 text-black">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-8 py-6">
          <h1 className="text-2xl font-serif uppercase tracking-wider">Book Your Fitting</h1>
          <p className="mt-1 text-sm text-zinc-500">Select your preferred appointment type and schedule.</p>
        </div>

        <div className="space-y-6 px-8 py-8">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceTypeId)}
              className="w-full rounded-md border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
            >
              {serviceTypes.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {requiresAddress && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Address</label>
              <textarea
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter full address for on-location fitting"
                className="w-full min-h-[80px] rounded-md border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Date</label>
              <input
                type="date"
                min={minBookingDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Time Slot</label>
              <div className="min-h-[46px] rounded-md border border-zinc-200 px-3 py-2">
                {isCheckingAvailability && <p className="text-sm text-zinc-500">Checking availability...</p>}

                {!isCheckingAvailability && !availableSlots.length && (
                  <p className="text-sm text-zinc-400">Select a date to view slots</p>
                )}

                {!isCheckingAvailability && availableSlots.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setTimeSlot(slot)}
                        className={`rounded px-3 py-1 text-xs font-semibold uppercase tracking-wide border ${
                          timeSlot === slot ? 'bg-black text-white border-black' : 'border-zinc-300 text-zinc-600 hover:border-zinc-500'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context for our tailoring team"
              className="w-full min-h-[80px] rounded-md border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <button
            type="button"
            onClick={submitBooking}
            disabled={isSubmitting || isCheckingAvailability}
            className="w-full rounded-sm bg-black px-4 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookFitPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <BookFitContent />
    </Suspense>
  );
}