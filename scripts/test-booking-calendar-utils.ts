import assert from 'node:assert/strict';

import {
  buildCalendarLinks,
  buildIcsEventContent,
  formatAppointmentLabel,
  toCalendarDateTime,
} from '../lib/booking/calendar.ts';

assert.equal(
  toCalendarDateTime('2026-03-30', '09:00 AM'),
  '20260330T090000Z',
  'toCalendarDateTime should format morning slots',
);

assert.equal(
  toCalendarDateTime('2026-03-30', '01:30 PM'),
  '20260330T133000Z',
  'toCalendarDateTime should format PM slots',
);

assert.equal(
  toCalendarDateTime('2026-03-30', '11:30 PM', 90),
  '20260331T010000Z',
  'toCalendarDateTime should roll date when adding duration',
);

assert.equal(
  toCalendarDateTime('2026-03-30', 'invalid'),
  null,
  'toCalendarDateTime should return null for invalid slots',
);

const label = formatAppointmentLabel('2026-03-30', '09:00 AM');
assert.equal(
  label.endsWith(' at 09:00 AM'),
  true,
  'formatAppointmentLabel should include timeslot suffix',
);

const ics = buildIcsEventContent({
  title: 'Fitting: Germaine Joseph Bespoke',
  date: '2026-03-30',
  timeSlot: '09:00 AM',
  durationMin: 60,
  location: 'Maison Showroom',
  description: 'Service: Showroom Fitting',
});

assert.equal(
  ics.includes('DTSTART:20260330T090000Z'),
  true,
  'ICS content should include start datetime',
);
assert.equal(
  ics.includes('DTEND:20260330T100000Z'),
  true,
  'ICS content should include end datetime',
);
assert.equal(
  ics.includes('LOCATION:Maison Showroom'),
  true,
  'ICS content should include location',
);
assert.equal(
  ics.includes('DESCRIPTION:Service: Showroom Fitting'),
  true,
  'ICS content should include description',
);
assert.equal(
  ics.includes('UID:gjm-'),
  true,
  'ICS content should include generated UID',
);
assert.equal(
  /DTSTAMP:\d{8}T\d{6}Z/.test(ics),
  true,
  'ICS content should include DTSTAMP in UTC timestamp format',
);
assert.equal(
  ics.includes('SEQUENCE:0'),
  true,
  'ICS content should include SEQUENCE field',
);
assert.equal(
  ics.includes('STATUS:CONFIRMED'),
  true,
  'ICS content should include confirmed STATUS field',
);
assert.equal(
  ics.includes('PRODID:-//Germaine Joseph//Booking Calendar//EN'),
  true,
  'ICS content should include PRODID header',
);
assert.equal(
  ics.includes('CALSCALE:GREGORIAN'),
  true,
  'ICS content should include CALSCALE header',
);
assert.equal(
  ics.includes('METHOD:PUBLISH'),
  true,
  'ICS content should include METHOD header',
);

const cancelledIcs = buildIcsEventContent({
  title: 'Fitting: Germaine Joseph Bespoke',
  date: '2026-03-30',
  timeSlot: '09:00 AM',
  durationMin: 60,
  status: 'CANCELLED',
  sequence: 2,
});

assert.equal(
  cancelledIcs.includes('STATUS:CANCELLED'),
  true,
  'ICS content should support custom STATUS values',
);
assert.equal(
  cancelledIcs.includes('SEQUENCE:2'),
  true,
  'ICS content should support custom SEQUENCE values',
);

const links = buildCalendarLinks({
  title: 'Fitting: Germaine Joseph Bespoke',
  location: 'Maison Showroom',
  date: '2026-03-30',
  timeSlot: '09:00 AM',
  durationMin: 60,
});

assert.equal(links !== null, true, 'Calendar links should be generated for valid inputs');
assert.equal(
  links?.googleCalendarUrl.includes('dates=20260330T090000Z/20260330T100000Z'),
  true,
  'Google calendar link should contain expected datetime range',
);
assert.equal(
  links?.outlookCalendarUrl.includes('startdt=20260330T090000Z'),
  true,
  'Outlook calendar link should contain expected start datetime',
);

console.log('booking calendar utilities: regression checks passed');
