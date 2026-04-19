'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { ServiceTypeOption } from '@/types/booking';
import {
  FALLBACK_SERVICE_TYPES,
  firstServiceTypeId,
  toServiceTypeMap,
  toServiceTypeSlotMap,
} from '@/lib/booking/serviceTypeCatalogClient';

export type RescheduleBookingModalState = {
  bookingId: string;
  initialDate: string;
  initialTimeSlot: string;
  initialServiceType: string;
};

export type RescheduleBookingResult = {
  bookingId: string;
  date: string;
  timeSlot: string;
  serviceType: string;
  startAtIso: string | null;
};

type Props = {
  isOpen: boolean;
  state: RescheduleBookingModalState | null;
  serviceTypes: ServiceTypeOption[];
  onClose: () => void;
  onRescheduled: (result: RescheduleBookingResult) => void;
};

type FormState = {
  date: string;
  timeSlot: string;
  serviceType: string;
  error: string;
};

function toYyyyMmDdLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function minDateForLeadTime(leadTimeHours: number): string {
  const next = new Date(Date.now() + leadTimeHours * 60 * 60 * 1000);
  return toYyyyMmDdLocal(next);
}

function toIsoFromDateAndTimeSlot(date: string, timeSlot: string): string | null {
  const match = timeSlot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  const d = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export default function RescheduleBookingModal({
  isOpen,
  state,
  serviceTypes,
  onClose,
  onRescheduled,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<string[]>([]);

  const catalog = serviceTypes.length ? serviceTypes : FALLBACK_SERVICE_TYPES;
  const serviceTypeMap = useMemo(() => toServiceTypeMap(catalog), [catalog]);
  const serviceTypeIds = useMemo(() => catalog.map((serviceType) => serviceType.id), [catalog]);
  const slotMap = useMemo(() => toServiceTypeSlotMap(catalog), [catalog]);
  const defaultServiceType = firstServiceTypeId(catalog);
  const formDate = form?.date;
  const formServiceType = form?.serviceType;

  useEffect(() => {
    if (!isOpen || !state) {
      setForm(null);
      setIsSubmitting(false);
      setIsLoadingAvailability(false);
      setAvailabilitySlots([]);
      return;
    }

    const startingServiceType = slotMap[state.initialServiceType]
      ? state.initialServiceType
      : defaultServiceType;
    const slots = slotMap[startingServiceType] || slotMap[defaultServiceType] || [];
    const leadHours = serviceTypeMap[startingServiceType]?.leadTimeHours ?? 24;
    const minDate = minDateForLeadTime(leadHours);

    setForm({
      date: state.initialDate >= minDate ? state.initialDate : minDate,
      timeSlot: slots.includes(state.initialTimeSlot) ? state.initialTimeSlot : slots[0] || '',
      serviceType: startingServiceType,
      error: '',
    });
  }, [isOpen, state, slotMap, defaultServiceType, serviceTypeMap]);

  useEffect(() => {
    if (!isOpen || !state || !formDate || !formServiceType) {
      return;
    }

    const currentState = state;
    const selectedDate = formDate;
    const selectedServiceType = formServiceType;
    let cancelled = false;

    async function loadAvailability() {
      setIsLoadingAvailability(true);

      try {
        const query = new URLSearchParams({
          bookingId: currentState.bookingId,
          date: selectedDate,
          serviceType: selectedServiceType,
        });

        const response = await fetch(`/api/bookings/reschedule/availability?${query.toString()}`, {
          cache: 'no-store',
        });
        const payload = (await response.json()) as {
          success?: boolean;
          message?: string;
          availableSlots?: string[];
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Failed to load availability');
        }

        if (cancelled) return;

        const slots = Array.isArray(payload.availableSlots) ? payload.availableSlots : [];
        setAvailabilitySlots(slots);

        setForm((previous) => {
          if (!previous) return previous;
          const fallbackSlots = slotMap[previous.serviceType] || slotMap[defaultServiceType] || [];
          const nextSlots = slots.length ? slots : fallbackSlots;
          const nextTimeSlot = nextSlots.includes(previous.timeSlot)
            ? previous.timeSlot
            : nextSlots[0] || '';

          return {
            ...previous,
            timeSlot: nextTimeSlot,
            error: previous.error === 'No available slots for selected date.' ? '' : previous.error,
          };
        });
      } catch (error) {
        if (cancelled) return;

        const message = error instanceof Error ? error.message : 'Failed to load availability';
        setAvailabilitySlots([]);
        setForm((previous) =>
          previous
            ? {
                ...previous,
                error: message,
              }
            : previous,
        );
      } finally {
        if (!cancelled) {
          setIsLoadingAvailability(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [isOpen, state, formDate, formServiceType, slotMap, defaultServiceType]);

  useEffect(() => {
    if (!isOpen || !state) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isSubmitting) return;
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, state, isSubmitting, onClose]);

  if (!isOpen || !state || !form) {
    return null;
  }

  const selectedServiceType = form.serviceType || defaultServiceType;
  const selectedServiceConfig = serviceTypeMap[selectedServiceType];
  const minLeadDate = minDateForLeadTime(selectedServiceConfig?.leadTimeHours ?? 24);
  const fallbackTimeSlotOptions = slotMap[selectedServiceType] || slotMap[defaultServiceType] || [];
  const timeSlotOptions = availabilitySlots.length ? availabilitySlots : fallbackTimeSlotOptions;

  async function submitReschedule(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const currentState = state;
    if (!currentState) return;

    const currentForm = form;
    if (!currentForm) return;

    if (!currentForm.date || !currentForm.timeSlot) {
      setForm((previous) => (previous ? { ...previous, error: 'Date and time slot are required.' } : previous));
      return;
    }

    if (currentForm.date < minLeadDate) {
      setForm((previous) =>
        previous
          ? {
              ...previous,
              error: `Selected date must be on or after ${minLeadDate} for ${selectedServiceConfig?.label || selectedServiceType}.`,
            }
          : previous,
      );
      return;
    }

    if (!timeSlotOptions.includes(currentForm.timeSlot)) {
      setForm((previous) =>
        previous
          ? {
              ...previous,
              error: 'Please select a valid time slot for the selected service type.',
            }
          : previous,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bookings/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: currentState.bookingId,
          date: currentForm.date,
          timeSlot: currentForm.timeSlot,
          serviceType: currentForm.serviceType,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        current?: {
          date?: string;
          timeSlot?: string;
          serviceType?: string;
          startAtIso?: string;
        };
      };
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to reschedule booking');
      }

      const nextCurrent = data.current;

      onRescheduled({
        bookingId: currentState.bookingId,
        date: nextCurrent?.date || currentForm.date,
        timeSlot: nextCurrent?.timeSlot || currentForm.timeSlot,
        serviceType: nextCurrent?.serviceType || currentForm.serviceType,
        startAtIso:
          nextCurrent?.startAtIso ||
          toIsoFromDateAndTimeSlot(
            nextCurrent?.date || currentForm.date,
            nextCurrent?.timeSlot || currentForm.timeSlot,
          ),
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reschedule booking';
      setForm((previous) => (previous ? { ...previous, error: message } : previous));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        if (isSubmitting) return;
        onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-serif text-zinc-900">Reschedule Booking</h2>
        <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
          Booking ID: {state.bookingId.slice(0, 8)}
        </p>

        <form className="mt-5 space-y-4" onSubmit={(event) => void submitReschedule(event)}>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Date
            </label>
            <input
              type="date"
              min={minLeadDate}
              value={form.date}
              onChange={(e) =>
                setForm((previous) =>
                  previous ? { ...previous, date: e.target.value, error: '' } : previous,
                )
              }
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Earliest allowed date based on lead time: {minLeadDate}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Time Slot
            </label>
            <select
              value={form.timeSlot}
              disabled={isLoadingAvailability}
              onChange={(e) =>
                setForm((previous) =>
                  previous ? { ...previous, timeSlot: e.target.value, error: '' } : previous,
                )
              }
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            >
              {isLoadingAvailability && <option value="">Loading slots...</option>}
              {!isLoadingAvailability && timeSlotOptions.length === 0 && (
                <option value="">No available slots</option>
              )}
              {timeSlotOptions.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Service Type
            </label>
            <select
              value={form.serviceType}
              onChange={(e) =>
                setForm((previous) => {
                  if (!previous) return previous;
                  const nextServiceType = e.target.value;
                  const nextLeadMin = minDateForLeadTime(serviceTypeMap[nextServiceType]?.leadTimeHours ?? 24);
                  const nextSlots = slotMap[nextServiceType] || slotMap[defaultServiceType] || [];
                  return {
                    ...previous,
                    serviceType: nextServiceType,
                    date: previous.date >= nextLeadMin ? previous.date : nextLeadMin,
                    timeSlot: nextSlots[0] || '',
                    error: '',
                  };
                })
              }
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            >
              {serviceTypeIds.map((serviceType) => (
                <option key={serviceType} value={serviceType}>
                  {serviceTypeMap[serviceType]?.label || serviceType}
                </option>
              ))}
            </select>
          </div>

          {form.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {form.error}
            </p>
          )}

          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
