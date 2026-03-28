import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type JsonRecord = Record<string, unknown>;

export interface LifecycleAutomationConfig {
  savedFitLeadDays: number;
  staleProfileDays: number;
  preEventLeadHours: number;
  postEventLagHours: number;
  bookingWindowMinutes: number;
  maxBatchSize: number;
}

export const DEFAULT_LIFECYCLE_AUTOMATION_CONFIG: LifecycleAutomationConfig = {
  savedFitLeadDays: Number(process.env.LIFECYCLE_SAVED_FIT_LEAD_DAYS || 150),
  staleProfileDays: Number(process.env.LIFECYCLE_STALE_PROFILE_DAYS || 180),
  preEventLeadHours: Number(process.env.LIFECYCLE_PRE_EVENT_LEAD_HOURS || 24),
  postEventLagHours: Number(process.env.LIFECYCLE_POST_EVENT_LAG_HOURS || 48),
  bookingWindowMinutes: Number(process.env.LIFECYCLE_BOOKING_WINDOW_MINUTES || 90),
  maxBatchSize: Number(process.env.LIFECYCLE_MAX_BATCH_SIZE || 50),
};

export interface FitReminderCandidate {
  id: string;
  email: string;
  customerId: string | null;
  profileName: string | null;
  updatedAt: Date;
  ageDays: number;
  technicalSpecs: unknown;
}

export interface BookingReminderCandidate {
  id: string;
  email: string;
  serviceType: string;
  startAt: Date;
  location: unknown;
  notes: string | null;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function calculateAgeDays(updatedAt: Date, now: Date): number {
  return Math.floor((now.getTime() - updatedAt.getTime()) / (24 * 60 * 60 * 1000));
}

function getWindowAround(now: Date, offsetHours: number, windowMinutes: number) {
  const center = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
  const delta = windowMinutes * 60 * 1000;
  return {
    from: new Date(center.getTime() - delta),
    to: new Date(center.getTime() + delta),
  };
}

function lifecycleMarkerToken(marker: string): string {
  return `[lifecycle:${marker}]`;
}

function hasBookingLifecycleMarker(notes: string | null | undefined, marker: string): boolean {
  if (!notes) return false;
  return notes.includes(lifecycleMarkerToken(marker));
}

function appendBookingLifecycleMarker(notes: string | null | undefined, marker: string, now: Date): string {
  const token = `${lifecycleMarkerToken(marker)} ${now.toISOString()}`;
  if (!notes?.trim()) return token;
  return `${notes}\n${token}`;
}

function hasProfileLifecycleMarker(technicalSpecs: unknown, marker: string): boolean {
  const specs = asRecord(technicalSpecs);
  const notifications = asRecord(specs.notifications);
  const lifecycle = asRecord(notifications.lifecycle);
  return typeof lifecycle[marker] === 'string' && String(lifecycle[marker]).trim().length > 0;
}

function setProfileLifecycleMarker(technicalSpecs: unknown, marker: string, timestamp: string): JsonRecord {
  const specs = asRecord(technicalSpecs);
  const notifications = asRecord(specs.notifications);
  const lifecycle = asRecord(notifications.lifecycle);

  return {
    ...specs,
    notifications: {
      ...notifications,
      lifecycle: {
        ...lifecycle,
        [marker]: timestamp,
      },
    },
  };
}

export async function listSavedFitReactivationCandidates(
  now: Date,
  config: LifecycleAutomationConfig = DEFAULT_LIFECYCLE_AUTOMATION_CONFIG,
): Promise<FitReminderCandidate[]> {
  const reactivationThreshold = new Date(now.getTime() - config.savedFitLeadDays * 24 * 60 * 60 * 1000);
  const staleThreshold = new Date(now.getTime() - config.staleProfileDays * 24 * 60 * 60 * 1000);

  const rows = await prisma.fitProfile.findMany({
    where: {
      isActive: true,
      email: { not: '' },
      updatedAt: {
        lte: reactivationThreshold,
        gt: staleThreshold,
      },
    },
    orderBy: { updatedAt: 'asc' },
    take: config.maxBatchSize,
    select: {
      id: true,
      email: true,
      customerId: true,
      profile_name: true,
      updatedAt: true,
      technicalSpecs: true,
    },
  });

  return rows
    .filter((row) => !hasProfileLifecycleMarker(row.technicalSpecs, 'saved_fit_reactivation_sent_at'))
    .map((row) => ({
      id: row.id,
      email: row.email,
      customerId: row.customerId,
      profileName: row.profile_name,
      updatedAt: row.updatedAt,
      ageDays: calculateAgeDays(row.updatedAt, now),
      technicalSpecs: row.technicalSpecs,
    }));
}

export async function listRefitReminderCandidates(
  now: Date,
  config: LifecycleAutomationConfig = DEFAULT_LIFECYCLE_AUTOMATION_CONFIG,
): Promise<FitReminderCandidate[]> {
  const staleThreshold = new Date(now.getTime() - config.staleProfileDays * 24 * 60 * 60 * 1000);

  const rows = await prisma.fitProfile.findMany({
    where: {
      isActive: true,
      email: { not: '' },
      updatedAt: {
        lte: staleThreshold,
      },
    },
    orderBy: { updatedAt: 'asc' },
    take: config.maxBatchSize,
    select: {
      id: true,
      email: true,
      customerId: true,
      profile_name: true,
      updatedAt: true,
      technicalSpecs: true,
    },
  });

  return rows
    .filter((row) => !hasProfileLifecycleMarker(row.technicalSpecs, 'refit_reminder_sent_at'))
    .map((row) => ({
      id: row.id,
      email: row.email,
      customerId: row.customerId,
      profileName: row.profile_name,
      updatedAt: row.updatedAt,
      ageDays: calculateAgeDays(row.updatedAt, now),
      technicalSpecs: row.technicalSpecs,
    }));
}

export async function listPreEventBookingReminderCandidates(
  now: Date,
  config: LifecycleAutomationConfig = DEFAULT_LIFECYCLE_AUTOMATION_CONFIG,
): Promise<BookingReminderCandidate[]> {
  const window = getWindowAround(now, config.preEventLeadHours, config.bookingWindowMinutes);

  const rows = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      startAt: {
        gte: window.from,
        lte: window.to,
      },
    },
    orderBy: { startAt: 'asc' },
    take: config.maxBatchSize,
    select: {
      id: true,
      email: true,
      serviceType: true,
      startAt: true,
      location: true,
      notes: true,
    },
  });

  return rows.filter((row) => !hasBookingLifecycleMarker(row.notes, 'pre_event_reminder_sent'));
}

export async function listPostEventFollowupCandidates(
  now: Date,
  config: LifecycleAutomationConfig = DEFAULT_LIFECYCLE_AUTOMATION_CONFIG,
): Promise<BookingReminderCandidate[]> {
  const window = getWindowAround(now, -config.postEventLagHours, config.bookingWindowMinutes);

  const rows = await prisma.booking.findMany({
    where: {
      status: {
        not: 'cancelled',
      },
      startAt: {
        gte: window.from,
        lte: window.to,
      },
    },
    orderBy: { startAt: 'asc' },
    take: config.maxBatchSize,
    select: {
      id: true,
      email: true,
      serviceType: true,
      startAt: true,
      location: true,
      notes: true,
    },
  });

  return rows.filter((row) => !hasBookingLifecycleMarker(row.notes, 'post_event_followup_sent'));
}

export async function markSavedFitReactivationSent(profileId: string, technicalSpecs: unknown, now: Date) {
  await prisma.fitProfile.update({
    where: { id: profileId },
    data: {
      technicalSpecs: setProfileLifecycleMarker(
        technicalSpecs,
        'saved_fit_reactivation_sent_at',
        now.toISOString(),
      ) as Prisma.InputJsonValue,
    },
  });
}

export async function markRefitReminderSent(profileId: string, technicalSpecs: unknown, now: Date) {
  await prisma.fitProfile.update({
    where: { id: profileId },
    data: {
      technicalSpecs: setProfileLifecycleMarker(
        technicalSpecs,
        'refit_reminder_sent_at',
        now.toISOString(),
      ) as Prisma.InputJsonValue,
    },
  });
}

export async function markBookingPreEventReminderSent(bookingId: string, notes: string | null | undefined, now: Date) {
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      notes: appendBookingLifecycleMarker(notes, 'pre_event_reminder_sent', now),
    },
  });
}

export async function markBookingPostEventFollowupSent(bookingId: string, notes: string | null | undefined, now: Date) {
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      notes: appendBookingLifecycleMarker(notes, 'post_event_followup_sent', now),
    },
  });
}

export function readBookingLocationAddress(location: unknown): string {
  if (typeof location !== 'object' || location === null) return 'Maison Showroom';
  if (
    'address' in (location as Record<string, unknown>) &&
    typeof (location as { address?: unknown }).address === 'string' &&
    (location as { address?: string }).address?.trim()
  ) {
    return (location as { address: string }).address;
  }
  return 'Maison Showroom';
}

export function toDateAndTimeSlot(startAt: Date): { date: string; timeSlot: string } {
  const date = startAt.toISOString().slice(0, 10);
  const hours = startAt.getUTCHours();
  const minutes = String(startAt.getUTCMinutes()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return { date, timeSlot: `${hour12}:${minutes} ${meridiem}` };
}
