type IcsEventInput = {
  title: string;
  date: string;
  timeSlot: string;
  durationMin: number;
  location?: string;
  description?: string;
  sequence?: number;
  status?: 'CONFIRMED' | 'CANCELLED' | 'TENTATIVE';
};

type CalendarLinksInput = {
  title: string;
  location: string;
  date: string;
  timeSlot: string;
  durationMin: number;
};

type CalendarLinks = {
  googleCalendarUrl: string;
  outlookCalendarUrl: string;
};

function normalizeIcsText(value: string): string {
  return value
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toIcsUtcTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function buildIcsUid(input: IcsEventInput, startStamp: string): string {
  const base = `${input.title}|${input.date}|${input.timeSlot}|${input.location || ''}|${startStamp}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }

  return `gjm-${hash.toString(16)}-${startStamp}@germainejoseph.com`;
}

function toUtcDateFromDateAndTime(
  date: string,
  timeSlot: string,
  addMinutes = 0,
): Date | null {
  const [timePart, meridiemRaw] = timeSlot.trim().split(/\s+/);
  if (!timePart || !meridiemRaw) {
    return null;
  }

  const [hoursPart, minutesPart] = timePart.split(':');
  const parsedHours = Number.parseInt(hoursPart || '', 10);
  const parsedMinutes = Number.parseInt(minutesPart || '', 10);

  if (!Number.isFinite(parsedHours) || !Number.isFinite(parsedMinutes)) {
    return null;
  }

  const meridiem = meridiemRaw.toUpperCase();
  let hours = parsedHours;
  if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  }
  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  const output = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(output.getTime())) {
    return null;
  }

  output.setUTCHours(hours, parsedMinutes + addMinutes, 0, 0);
  return output;
}

export function toCalendarDateTime(date: string, timeSlot: string, addMinutes = 0): string | null {
  const utcDate = toUtcDateFromDateAndTime(date, timeSlot, addMinutes);
  if (!utcDate) {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${utcDate.getUTCFullYear()}${pad(utcDate.getUTCMonth() + 1)}${pad(utcDate.getUTCDate())}T${pad(utcDate.getUTCHours())}${pad(utcDate.getUTCMinutes())}00Z`;
}

export function formatAppointmentLabel(date: string, timeSlot: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    return timeSlot;
  }

  const formatted = d.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  return `${formatted} at ${timeSlot}`;
}

export function buildIcsEventContent(input: IcsEventInput): string {
  const dtStart = toCalendarDateTime(input.date, input.timeSlot);
  const dtEnd = toCalendarDateTime(input.date, input.timeSlot, input.durationMin);
  const dtStamp = toIcsUtcTimestamp(new Date());
  const uid = buildIcsUid(input, dtStart || 'pending');
  const safeSequence =
    Number.isFinite(input.sequence) && (input.sequence as number) >= 0
      ? Math.floor(input.sequence as number)
      : 0;
  const safeStatus = input.status || 'CONFIRMED';
  const normalizedTitle = normalizeIcsText(input.title);
  const normalizedLocation = input.location ? normalizeIcsText(input.location) : '';
  const normalizedDescription = input.description ? normalizeIcsText(input.description) : '';

  if (!dtStart || !dtEnd) {
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Germaine Joseph//Booking Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `SEQUENCE:${safeSequence}`,
      `STATUS:${safeStatus}`,
      `SUMMARY:${normalizedTitle}`,
      ...(normalizedLocation ? [`LOCATION:${normalizedLocation}`] : []),
      ...(normalizedDescription ? [`DESCRIPTION:${normalizedDescription}`] : []),
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Germaine Joseph//Booking Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `SEQUENCE:${safeSequence}`,
    `STATUS:${safeStatus}`,
    `SUMMARY:${normalizedTitle}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    ...(normalizedLocation ? [`LOCATION:${normalizedLocation}`] : []),
    ...(normalizedDescription ? [`DESCRIPTION:${normalizedDescription}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');
}

export function buildCalendarLinks(input: CalendarLinksInput): CalendarLinks | null {
  const dtStart = toCalendarDateTime(input.date, input.timeSlot);
  const dtEnd = toCalendarDateTime(input.date, input.timeSlot, input.durationMin);
  if (!dtStart || !dtEnd) {
    return null;
  }

  const title = encodeURIComponent(input.title);
  const location = encodeURIComponent(input.location);

  return {
    googleCalendarUrl:
      `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dtStart}/${dtEnd}&location=${location}`,
    outlookCalendarUrl:
      `https://outlook.office.com/calendar/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${dtStart}&enddt=${dtEnd}&subject=${title}&location=${location}`,
  };
}