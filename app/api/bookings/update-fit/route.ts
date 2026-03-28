import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { BookingConfirmationEmail } from '@/components/emails/BookingConfirmation';
import { emitBookingLifecycleEvent } from '@/lib/automation/bookingLifecycleEvents';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

function toCompactDateTimeParts(parts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
}): string {
  const yyyy = parts.year;
  const mm = pad2(parts.month);
  const dd = pad2(parts.day);
  const hh = pad2(parts.hour);
  const min = pad2(parts.minute);
  const sec = pad2(parts.second ?? 0);
  return `${yyyy}${mm}${dd}T${hh}${min}${sec}`;
}

function toCompactUtcDateTime(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = pad2(date.getUTCMonth() + 1);
  const dd = pad2(date.getUTCDate());
  const hh = pad2(date.getUTCHours());
  const min = pad2(date.getUTCMinutes());
  const sec = pad2(date.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${min}${sec}Z`;
}

function parseAppointmentDateTime(dateYmd?: string, time12h?: string): Date | null {
  if (!dateYmd || !time12h) return null;

  const dateParts = dateYmd.split('-').map(Number);
  if (dateParts.length !== 3) return null;

  const [year, month, day] = dateParts;
  const timeMatch = time12h.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!timeMatch) return null;

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const meridiem = timeMatch[3].toUpperCase();

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  const parsed = new Date(year, month - 1, day, hour, minute, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseAppointmentParts(dateYmd?: string, time12h?: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} | null {
  if (!dateYmd || !time12h) return null;
  const dateParts = dateYmd.split('-').map(Number);
  if (dateParts.length !== 3) return null;

  const [year, month, day] = dateParts;
  const timeMatch = time12h.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!timeMatch) return null;

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const meridiem = timeMatch[3].toUpperCase();

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  return { year, month, day, hour, minute };
}

function getTimeZoneParts(date: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value || '0');
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
    minute: pick('minute'),
    second: pick('second'),
  };
}

function toCompactDateTimeInTimeZone(date: Date, timeZone: string): string {
  return toCompactDateTimeParts(getTimeZoneParts(date, timeZone));
}

function zonedDateTimeToUtc(parts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}, timeZone: string): Date {
  let guessUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);

  for (let i = 0; i < 2; i += 1) {
    const actual = getTimeZoneParts(new Date(guessUtcMs), timeZone);
    const actualAsUtcMs = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second
    );
    const desiredAsUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
    const deltaMs = desiredAsUtcMs - actualAsUtcMs;
    if (deltaMs === 0) break;
    guessUtcMs += deltaMs;
  }

  return new Date(guessUtcMs);
}

function isValidIanaTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz.trim()) return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function buildCalendarInvite(options: {
  startLocal: string;
  endLocal: string;
  timeZone: string;
  uid: string;
  attendeeEmail: string;
  location: string;
  description: string;
}): string {
  const dtStamp = toCompactUtcDateTime(new Date());
  const dtStart = options.startLocal;
  const dtEnd = options.endLocal;

  // RFC5545 .ics invite for Apple/Outlook/Gmail calendar import.
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Germaine Joseph//Booking Confirmation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${options.uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=${options.timeZone}:${dtStart}`,
    `DTEND;TZID=${options.timeZone}:${dtEnd}`,
    'SUMMARY:Germaine Joseph Fitting Appointment',
    `DESCRIPTION:${options.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${options.location}`,
    `ATTENDEE;CN=Client;ROLE=REQ-PARTICIPANT:mailto:${options.attendeeEmail}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function buildGoogleCalendarLink(start: Date, end: Date): string {
  const startUtc = toCompactUtcDateTime(start).replace('Z', '');
  const endUtc = toCompactUtcDateTime(end).replace('Z', '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Germaine Joseph Fitting Appointment',
    dates: `${startUtc}Z/${endUtc}Z`,
    details: 'Your fitting appointment has been confirmed by Germaine Joseph.',
    location: 'Germaine Joseph Atelier',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookCalendarLink(start: Date, end: Date): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: 'Germaine Joseph Fitting Appointment',
    body: 'Your fitting appointment has been confirmed by Germaine Joseph.',
    location: 'Germaine Joseph Atelier',
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      email,
      fitPreference, 
      jacketSize, 
      trouserSize, 
      technicalSpecs, 
      fitProfileId,
      bookingId,
      appointmentDate,
      appointmentTime
    } = data;

    const fromAddress = process.env.RESEND_FROM || 'Digital Tailor <system@germainejoseph.com>';
    const emailStatus: {
      tailor: { sent: boolean; id?: string; error?: string };
      customer: { sent: boolean; id?: string; error?: string; skipped?: boolean };
    } = {
      tailor: { sent: false },
      customer: { sent: false, skipped: true },
    };

    const dashboardUrl =
      process.env.MAISON_DASHBOARD_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/appointments`;
    const confirmationCooldownMinutes = Number(process.env.BOOKING_CONFIRMATION_COOLDOWN_MINUTES || 30);

    // PRESERVED: Your safe access for alert
    const alert = data.alert || technicalSpecs?.alert || "STANDARD FIT";
    
    // PRESERVED & ENHANCED: Extracting attributes while ensuring we catch the new ones
    const { attributes = {}, preferences = {} } = technicalSpecs || {};

    const existingProfile = await prisma.fitProfile.findFirst({
      where: {
        OR: [
          { id: fitProfileId || bookingId || "00000000-0000-0000-0000-000000000000" },
          { email: email || "info@germainejoseph.com" }
        ]
      },
    });

    if (!existingProfile) {
      return NextResponse.json({
        success: true,
        count: 0,
        emailStatus: {
          tailor: { sent: false, skipped: true },
          customer: { sent: false, skipped: true, error: 'No matching fitProfile found' },
        },
      });
    }

    const existingTechnicalSpecs = asRecord(existingProfile.technicalSpecs);
    const incomingTechnicalSpecs = asRecord(technicalSpecs);
    const mergedTechnicalSpecs: Record<string, unknown> = {
      ...existingTechnicalSpecs,
      ...incomingTechnicalSpecs,
      attributes: {
        ...asRecord(existingTechnicalSpecs.attributes),
        ...attributes,
      },
      preferences: {
        ...asRecord(existingTechnicalSpecs.preferences),
        ...preferences,
      },
    };

    // 1. UPDATE DATABASE
    // We target 'fitProfile' as that is what your dashboard reads from
    await prisma.fitProfile.update({
      where: { id: existingProfile.id },
      data: {
        jacketSize: jacketSize.toString(),
        trouserSize: trouserSize.toString(),
        fitPreference: fitPreference,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        technicalSpecs: mergedTechnicalSpecs as Prisma.InputJsonValue,
      },
    });

    const promotionDate = typeof appointmentDate === 'string' ? appointmentDate : undefined;
    const promotionTimeSlot = typeof appointmentTime === 'string' ? appointmentTime : undefined;
    const promoted = await prisma.booking.findFirst({
      where: {
        email: existingProfile.email,
        status: 'pending_fit_refresh',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        serviceType: true,
        location: true,
      },
    });

    if (promoted) {
      await prisma.booking.update({
        where: { id: promoted.id },
        data: {
          status: 'confirmed',
          fitProfileId: existingProfile.id,
          suggestedJacket: jacketSize ? String(jacketSize) : null,
          suggestedTrouser: trouserSize ? String(trouserSize) : null,
        },
      });

      const promotedLocation =
        promoted.location &&
        typeof promoted.location === 'object' &&
        'address' in (promoted.location as Record<string, unknown>) &&
        typeof (promoted.location as { address?: unknown }).address === 'string'
          ? ((promoted.location as { address?: string }).address ?? undefined)
          : undefined;

      emitBookingLifecycleEvent('booking_confirmed', {
        bookingId: promoted.id,
        email: existingProfile.email,
        serviceType: promoted.serviceType,
        date: promotionDate,
        timeSlot: promotionTimeSlot,
        location: promotedLocation,
        source: 'api/bookings/update-fit:promote-pending',
      }).catch((err) => {
        console.error('booking_confirmed event emit failed during fit refresh promotion:', err);
      });
    }

    // 2. PRESERVED: Your original tailorNotes formatting
    // 3. PRESERVED: Your full high-end HTML Email Template
    try {
      const tailorSend = await resend.emails.send({
        from: fromAddress,
        to: 'info@germainejoseph.com',
        subject: `MTM PROFILE: ${alert} - ${email}`,
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 450px; margin: auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #000000; padding: 24px 16px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: 3px; text-transform: uppercase;">Germaine Joseph</h1>
            <p style="color: #9ca3af; margin-top: 4px; font-size: 10px; letter-spacing: 1px; text-transform: uppercase;">Master Tailor MTM Briefing</p>
          </div>
          
          <div style="padding: 20px;">
            <div style="background-color: ${alert.includes('MISMATCH') ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${alert.includes('MISMATCH') ? '#fee2e2' : '#dcfce7'}; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: ${alert.includes('MISMATCH') ? '#991b1b' : '#166534'}; text-transform: uppercase;">${alert}</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #374151;">${fitPreference} Configuration</p>
            </div>

            <div style="margin-bottom: 20px; background: #f9fafb; padding: 12px; border-radius: 8px;">
               <h3 style="font-size: 10px; color: #9ca3af; text-transform: uppercase; margin: 0 0 8px 0;">Physical Attribute Notes</h3>
               <p style="font-size: 13px; margin: 0; color: #111827;"><strong>Issues:</strong> ${attributes?.commonIssues || 'None Reported'}</p>
               <p style="font-size: 13px; margin: 4px 0 0 0; color: #374151;"><strong>Notes:</strong> ${attributes?.notes || 'No extra notes'}</p>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
              <div style="flex: 1; border: 1px solid #f3f4f6; padding: 12px; border-radius: 8px;">
                <h2 style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Jacket Block</h2>
                <span style="font-size: 32px; font-weight: 200;">${jacketSize}</span>
                <p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">Length: ${preferences?.jacketLength || 'Standard'}</p>
              </div>
              <div style="flex: 1; border: 1px solid #f3f4f6; padding: 12px; border-radius: 8px;">
                <h2 style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Trouser Block</h2>
                <span style="font-size: 32px; font-weight: 200;">${trouserSize}</span>
                <p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">Rise: ${preferences?.trouserRise || 'Standard'}</p>
              </div>
            </div>

            <div style="margin-bottom: 24px; padding: 12px; border: 1px solid #f3f4f6; border-radius: 8px;">
              <h2 style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Stylistic Intent</h2>
              <p style="font-size: 13px; color: #374151; margin: 0;">Break Preference: <strong>${preferences?.trouserBreak || 'Standard'}</strong></p>
            </div>

            <a href="${dashboardUrl}" style="display: block; background-color: #000000; color: #ffffff; text-align: center; padding: 18px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
                Open Booking Dashboard
            </a>
          </div>
        </div>
      `,
      });

      if (tailorSend.error) {
        emailStatus.tailor = { sent: false, error: tailorSend.error.message };
      } else {
        emailStatus.tailor = { sent: true, id: tailorSend.data?.id };
      }
    } catch (err) {
      emailStatus.tailor = {
        sent: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    const customerEmail = (typeof email === 'string' ? email.trim() : '') || existingProfile.email;
    const requestedTimeZone = attributes?.clientTimeZone;
    const appointmentTimeZone = isValidIanaTimeZone(requestedTimeZone) ? requestedTimeZone : 'Europe/Rome';
    const appointmentParts = parseAppointmentParts(appointmentDate, appointmentTime);
    const appointmentStart = appointmentParts
      ? zonedDateTimeToUtc(appointmentParts, appointmentTimeZone)
      : parseAppointmentDateTime(appointmentDate, appointmentTime);

    if (customerEmail && appointmentStart) {
      const appointmentEnd = new Date(appointmentStart.getTime() + 60 * 60 * 1000);
      const appointmentLabel = `${appointmentDate} @ ${appointmentTime} (${appointmentTimeZone})`;
      const location = attributes?.appointmentMode === 'Home'
        ? (attributes?.onLocationAddress || 'Home Service - Address on file')
        : 'Germaine Joseph Atelier';
      const description = [
        'Your fitting booking is confirmed.',
        `Appointment: ${appointmentLabel}`,
        `Mode: ${attributes?.appointmentMode || 'Studio'}`,
      ].join('\n');

      const calendarUid = `booking-${bookingId || customerEmail}-${appointmentDate}-${appointmentTime}`
        .replace(/\s+/g, '')
        .replace(/[^a-zA-Z0-9@._-]/g, '');
      const inviteKey = `${customerEmail.toLowerCase()}|${appointmentDate}|${appointmentTime}|${appointmentTimeZone}|${location}`;
      const notificationState = asRecord(mergedTechnicalSpecs.notifications);
      const previousCustomerConfirmation = asRecord(notificationState.customerBookingConfirmation);
      const previousInviteKey = typeof previousCustomerConfirmation.inviteKey === 'string'
        ? previousCustomerConfirmation.inviteKey
        : '';
      const previousSentAtIso = typeof previousCustomerConfirmation.sentAt === 'string'
        ? previousCustomerConfirmation.sentAt
        : '';
      const previousSentAt = previousSentAtIso ? new Date(previousSentAtIso) : null;
      const previousSentAtMs = previousSentAt && !Number.isNaN(previousSentAt.getTime())
        ? previousSentAt.getTime()
        : null;
      const nowMs = Date.now();
      const cooldownMs = Math.max(1, confirmationCooldownMinutes) * 60 * 1000;
      const isSameInvite = previousInviteKey === inviteKey;
      const withinCooldown = previousSentAtMs !== null && (nowMs - previousSentAtMs) < cooldownMs;
      const shouldSendCustomerEmail = !(isSameInvite && withinCooldown);

      if (!shouldSendCustomerEmail) {
        emailStatus.customer = {
          sent: false,
          skipped: true,
          error: `Duplicate invite suppressed (within ${Math.max(1, confirmationCooldownMinutes)} minutes)`,
        };
      } else {
        emailStatus.customer.skipped = false;
      }

      const calendarIcs = buildCalendarInvite({
        startLocal: appointmentParts
          ? toCompactDateTimeParts({ ...appointmentParts, second: 0 })
          : toCompactDateTimeInTimeZone(appointmentStart, appointmentTimeZone),
        endLocal: toCompactDateTimeInTimeZone(appointmentEnd, appointmentTimeZone),
        timeZone: appointmentTimeZone,
        uid: calendarUid,
        attendeeEmail: customerEmail,
        location,
        description,
      });

      const googleCalendarUrl = buildGoogleCalendarLink(appointmentStart, appointmentEnd);
      const outlookCalendarUrl = buildOutlookCalendarLink(appointmentStart, appointmentEnd);
      const customerHtml = await render(
        BookingConfirmationEmail({
          appointmentLabel,
          appointmentMode: attributes?.appointmentMode || 'Studio',
          location,
          googleCalendarUrl,
          outlookCalendarUrl,
        })
      );
      const customerText = [
        'Germaine Joseph - Booking Confirmed',
        '',
        'Your fitting appointment has been confirmed.',
        '',
        `Date & Time: ${appointmentLabel}`,
        `Mode: ${attributes?.appointmentMode || 'Studio'}`,
        `Location: ${location}`,
        '',
        'Add to calendar:',
        `Google Calendar: ${googleCalendarUrl}`,
        `Outlook Calendar: ${outlookCalendarUrl}`,
        '',
        'A .ics invite is attached to this email for Apple Calendar, Outlook, and other calendar clients.',
      ].join('\n');

      if (shouldSendCustomerEmail) {
        try {
          const customerSend = await resend.emails.send({
            from: fromAddress,
            to: customerEmail,
            subject: 'Your Germaine Joseph fitting is confirmed',
            html: customerHtml,
            text: customerText,
            attachments: [
              {
                filename: 'germaine-joseph-booking.ics',
                content: Buffer.from(calendarIcs).toString('base64'),
              },
            ],
          });

          if (customerSend.error) {
            emailStatus.customer = { sent: false, error: customerSend.error.message, skipped: false };
          } else {
            emailStatus.customer = { sent: true, id: customerSend.data?.id, skipped: false };
            mergedTechnicalSpecs.notifications = {
              ...notificationState,
              customerBookingConfirmation: {
                inviteKey,
                sentAt: new Date().toISOString(),
                messageId: customerSend.data?.id || null,
              },
            };
            await prisma.fitProfile.update({
              where: { id: existingProfile.id },
              data: { technicalSpecs: mergedTechnicalSpecs as Prisma.InputJsonValue },
            });
          }
        } catch (err) {
          emailStatus.customer = {
            sent: false,
            skipped: false,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: 1,
      emailStatus,
      promotedBookingId: promoted?.id ?? null,
    });
  } catch (error) {
    console.error("Critical Sync Error:", error);
    return NextResponse.json({ success: false, error: "Internal Sync Error" }, { status: 500 });
  }
}