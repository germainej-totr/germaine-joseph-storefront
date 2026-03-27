import assert from 'node:assert/strict';
import type { ZodSafeParseResult } from 'zod';

import {
  ADD_MTM_TROUSER_REQUEST_SCHEMA,
  AVAILABILITY_REQUEST_SCHEMA,
  BOOKING_UPDATE_REQUEST_SCHEMA,
  CART_ADD_REQUEST_SCHEMA,
  CONFIRM_REQUEST_SCHEMA,
} from '../lib/contracts/apiSchemas.ts';

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

console.log('API contract schemas: regression checks passed');