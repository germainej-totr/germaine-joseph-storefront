import assert from 'node:assert/strict';
import type { ZodSafeParseResult } from 'zod';

import {
  ADD_MTM_TROUSER_REQUEST_SCHEMA,
  AVAILABILITY_REQUEST_SCHEMA,
  BOOKING_SERVICE_TYPE_CATALOG_RESPONSE_SCHEMA,
  BOOKING_UPDATE_REQUEST_SCHEMA,
  CART_ADD_REQUEST_SCHEMA,
  CONFIRM_REQUEST_SCHEMA,
  RESCHEDULE_AVAILABILITY_QUERY_SCHEMA,
  RESCHEDULE_BOOKING_REQUEST_SCHEMA,
} from '../lib/contracts/apiSchemas.ts';
import { FALLBACK_SERVICE_TYPES } from '../lib/booking/serviceTypeCatalogClient.ts';

function assertValid(name: string, result: ZodSafeParseResult<unknown>) {
  assert.equal(result.success, true, `${name} should be valid`);
}

function assertInvalid(name: string, result: ZodSafeParseResult<unknown>) {
  assert.equal(result.success, false, `${name} should be invalid`);
}

assertValid(
  'availability valid payload',
  AVAILABILITY_REQUEST_SCHEMA.safeParse({ date: '2026-03-28', serviceType: 'showroom' }),
);
assertInvalid(
  'availability invalid date',
  AVAILABILITY_REQUEST_SCHEMA.safeParse({ date: '03/28/2026' }),
);

assertValid(
  'confirm valid payload',
  CONFIRM_REQUEST_SCHEMA.safeParse({
    serviceType: 'home_office',
    location: '123 Tailor Lane',
    date: '2026-03-28',
    timeSlot: '10:00 AM',
    customerEmail: 'customer@example.com',
  }),
);
assertInvalid(
  'confirm invalid email',
  CONFIRM_REQUEST_SCHEMA.safeParse({
    serviceType: 'showroom',
    date: '2026-03-28',
    timeSlot: '10:00 AM',
    customerEmail: 'not-an-email',
  }),
);

assertValid(
  'booking update cancel valid payload',
  BOOKING_UPDATE_REQUEST_SCHEMA.safeParse({
    action: 'cancel',
  }),
);
assertValid(
  'booking update reschedule valid payload',
  BOOKING_UPDATE_REQUEST_SCHEMA.safeParse({
    action: 'reschedule',
    serviceType: 'showroom',
    date: '2026-03-28',
    timeSlot: '10:00 AM',
  }),
);
assertInvalid(
  'booking update reschedule missing date/time payload',
  BOOKING_UPDATE_REQUEST_SCHEMA.safeParse({
    action: 'reschedule',
    serviceType: 'showroom',
  }),
);

assertValid(
  'reschedule availability query valid payload',
  RESCHEDULE_AVAILABILITY_QUERY_SCHEMA.safeParse({
    bookingId: 'booking_123',
    date: '2026-04-12',
    serviceType: 'showroom',
  }),
);
assertInvalid(
  'reschedule availability query invalid payload',
  RESCHEDULE_AVAILABILITY_QUERY_SCHEMA.safeParse({
    bookingId: '',
    date: '12-04-2026',
  }),
);

assertValid(
  'reschedule booking request valid payload',
  RESCHEDULE_BOOKING_REQUEST_SCHEMA.safeParse({
    bookingId: 'booking_123',
    date: '2026-04-12',
    timeSlot: '10:00 AM',
    serviceType: 'showroom',
  }),
);
assertInvalid(
  'reschedule booking request missing fields payload',
  RESCHEDULE_BOOKING_REQUEST_SCHEMA.safeParse({
    bookingId: 'booking_123',
    date: '2026-04-12',
  }),
);

assertValid(
  'cart add valid payload',
  CART_ADD_REQUEST_SCHEMA.safeParse({
    variantId: 'gid://shopify/ProductVariant/123',
    quantity: 1,
    productFlow: 'mtm_tailored',
    fitProfileId: 'fit_profile_1',
    mtmSpec: {
      category: 'trouser',
      options: { pleat_style: 'single' },
      measurements: { waist: 32 },
    },
  }),
);
assertInvalid(
  'cart add invalid quantity',
  CART_ADD_REQUEST_SCHEMA.safeParse({
    variantId: 'gid://shopify/ProductVariant/123',
    quantity: 0,
  }),
);

assertValid(
  'add mtm trouser valid payload',
  ADD_MTM_TROUSER_REQUEST_SCHEMA.safeParse({
    variantId: 'gid://shopify/ProductVariant/456',
    customAttributes: {
      gjm_mtm_category: 'trouser',
      gjm_fit_profile_id: 'fit_profile_1',
    },
  }),
);
assertInvalid(
  'add mtm trouser empty attributes',
  ADD_MTM_TROUSER_REQUEST_SCHEMA.safeParse({
    variantId: 'gid://shopify/ProductVariant/456',
    customAttributes: {},
  }),
);

assertValid(
  'booking service type catalog valid payload',
  BOOKING_SERVICE_TYPE_CATALOG_RESPONSE_SCHEMA.safeParse({
    serviceTypes: FALLBACK_SERVICE_TYPES,
  }),
);

assertInvalid(
  'booking service type catalog invalid payload',
  BOOKING_SERVICE_TYPE_CATALOG_RESPONSE_SCHEMA.safeParse({
    serviceTypes: [{ id: 'not-real', label: 'Broken' }],
  }),
);

console.log('API contract schemas: regression checks passed');