'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ServiceTypeId } from '@/types/booking';
import { useBookingServiceTypes } from '@/hooks/useBookingServiceTypes';
import { useBookingLocations } from '@/hooks/useBookingLocations';

function parseServiceTypeParam(value: string | null): ServiceTypeId | null {
  if (
    value === 'showroom' ||
    value === 'home_office' ||
    value === 'tailor_fitting' ||
    value === 'virtual' ||
    value === 'video_consult'
  ) {
    return value;
  }
  return null;
}

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

function formatValidationErrorDetails(details: unknown): string | null {
  if (!details || typeof details !== 'object') return null;
  const fieldErrors = (details as { fieldErrors?: Record<string, string[] | undefined> }).fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== 'object') return null;

  const messages: string[] = [];

  for (const [field, issues] of Object.entries(fieldErrors)) {
    if (!Array.isArray(issues)) continue;
    for (const issue of issues) {
      if (typeof issue === 'string' && issue.trim().length > 0) {
        messages.push(`${field}: ${issue}`);
      }
    }
  }

  if (messages.length === 0) return null;
  return messages.join(' | ');
}

function BookFitContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [serviceType, setServiceType] = useState<ServiceTypeId>(
    parseServiceTypeParam(searchParams.get('serviceType')) || 'showroom',
  );
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [timeSlot, setTimeSlot] = useState(searchParams.get('timeSlot') || '');
  const [notes, setNotes] = useState('');
  const [studioLocationId, setStudioLocationId] = useState(searchParams.get('locationId') || '');

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { serviceTypes, serviceTypeMap, defaultServiceType } = useBookingServiceTypes();
  const { enabledLocations, locationMap, defaultLocationId } = useBookingLocations();

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
    if (studioLocationId && locationMap[studioLocationId]?.enabled) {
      return;
    }

    if (defaultLocationId) {
      setStudioLocationId(defaultLocationId);
    }
  }, [defaultLocationId, locationMap, studioLocationId]);

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

  const requiresFitIntake = useMemo(
    () => serviceType === 'home_office' || serviceType === 'tailor_fitting',
    [serviceType],
  );

  const selectedStudioLocation = useMemo(
    () => locationMap[studioLocationId] || enabledLocations[0],
    [enabledLocations, locationMap, studioLocationId],
  );

  const fitRefreshUrl = useMemo(() => {
    const query = new URLSearchParams({
      email,
      source: 'fit-booking-refresh',
      serviceType,
    });

    if (date) query.set('date', date);
    if (timeSlot) query.set('timeSlot', timeSlot);
    if (studioLocationId) query.set('locationId', studioLocationId);
    if (location.trim()) query.set('location', location.trim());

    return `/configure-fit?${query.toString()}`;
  }, [date, email, location, serviceType, studioLocationId, timeSlot]);

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
          location:
            requiresAddress
              ? location.trim()
              : (selectedStudioLocation?.address || 'Maison Showroom (address shared on confirmation)'),
          date,
          timeSlot,
          customerEmail: email,
          notes,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const detailsMessage = formatValidationErrorDetails(data?.details);
        throw new Error(detailsMessage || data.message || 'Unable to confirm booking');
      }

      if (data.requiresFitRefresh) {
        const fallbackRefreshUrl = fitRefreshUrl;
        window.location.href = typeof data.fitRefreshUrl === 'string' ? data.fitRefreshUrl : fallbackRefreshUrl;
        return;
      }

      const destination = new URL(
        typeof data.manageUrl === 'string' ? data.manageUrl : '/booking-confirmed',
        window.location.origin,
      );
      destination.searchParams.set('time', timeSlot);
      destination.searchParams.set('date', date);
      destination.searchParams.set('email', email);
      destination.searchParams.set('useCase', useCase);
      destination.searchParams.set('serviceType', serviceType);
      if (typeof data.bookingId === 'string' && data.bookingId) {
        destination.searchParams.set('bookingId', data.bookingId);
      }
      if (typeof data.manageToken === 'string' && data.manageToken) {
        destination.searchParams.set('manageToken', data.manageToken);
      }
      window.location.href = `${destination.pathname}?${destination.searchParams.toString()}`;
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

          {!requiresAddress && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Studio Location</label>
              <select
                value={studioLocationId}
                onChange={(e) => setStudioLocationId(e.target.value)}
                className="w-full rounded-md border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              >
                {enabledLocations.map((locationOption) => (
                  <option key={locationOption.id} value={locationOption.id}>
                    {locationOption.label} - {locationOption.city}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500">
                {selectedStudioLocation?.address || 'Studio address will be shared on confirmation.'}
              </p>
            </div>
          )}

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

          {requiresFitIntake && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Home / Office Visit and Tailor Fitting require completed FitGate + Smart Fit profile data.
              <a
                href={fitRefreshUrl}
                className="ml-1 font-semibold underline"
              >
                Complete fit profile first
              </a>
              .
            </div>
          )}

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