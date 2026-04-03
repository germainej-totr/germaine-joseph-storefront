import assert from 'node:assert/strict';
import type { ZodSafeParseResult } from 'zod';

import {
  ADD_MTM_ITEM_REQUEST_SCHEMA,
  ADD_MTM_TROUSER_REQUEST_SCHEMA,
  AVAILABILITY_REQUEST_SCHEMA,
  BOOKING_SERVICE_TYPE_CATALOG_RESPONSE_SCHEMA,
  BOOKING_UPDATE_REQUEST_SCHEMA,
  CART_ADD_REQUEST_SCHEMA,
  CONFIRM_REQUEST_SCHEMA,
  RESCHEDULE_AVAILABILITY_QUERY_SCHEMA,
  RESCHEDULE_BOOKING_REQUEST_SCHEMA,
} from '../lib/contracts/apiSchemas.ts';
import {
  FIT_PROFILE_CREATE_SCHEMA,
  FIT_PROFILE_DETAIL_RESPONSE_SCHEMA,
  FIT_PROFILE_LIST_RESPONSE_SCHEMA,
  FIT_PROFILE_UPDATE_SCHEMA,
} from '../lib/fit/FitProfileSchema.ts';
import {
  MTM_CANONICAL_PAYLOAD_SCHEMA,
  MTM_CANONICAL_PAYLOAD_STRICT_SCHEMA,
} from '../lib/mtm/MtmCanonicalSchema.ts';
import {
  parseCategoryHandoffFromQuery,
} from '../lib/mtm/CategoryFitHandoffStorage.ts';
import { buildCategoryCartPayload } from '../lib/mtm/CategoryCartPayloadBuilder.ts';
import { deriveCategoryAnalyticsFields } from '../lib/analytics/mtmCategoryAnalytics.ts';
import {
  validateCanonicalPayload,
  validateCanonicalPayloadForPersistence,
  validatePayloadWithVersionCheck,
  isPayloadReadyForCommerce,
  isPayloadReadyForFulfilment,
} from '../lib/mtm/MtmCanonicalValidator.ts';
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
  'fit profile create valid payload',
  FIT_PROFILE_CREATE_SCHEMA.safeParse({
    email: 'customer@example.com',
    label: 'Primary profile',
    categoryDefaults: { jacket: { size: '50' }, trouser: { size: '34' } },
  }),
);
assertInvalid(
  'fit profile create invalid payload',
  FIT_PROFILE_CREATE_SCHEMA.safeParse({
    email: 'bad-email',
  }),
);

assertValid(
  'fit profile update valid payload',
  FIT_PROFILE_UPDATE_SCHEMA.safeParse({
    label: 'Updated profile',
    fitPreference: 'Slim Fit',
  }),
);

assertValid(
  'fit profile list response valid payload',
  FIT_PROFILE_LIST_RESPONSE_SCHEMA.safeParse({
    ok: true,
    profiles: [
      {
        id: 'fit_123',
        label: 'Primary profile',
        email: 'customer@example.com',
        categoryDefaults: { jacket: { size: '50' } },
        isActive: true,
        updatedAt: '2026-03-28T10:00:00.000Z',
        version: 2,
      },
    ],
    defaultFitProfileId: 'fit_123',
  }),
);

assertValid(
  'fit profile detail response valid payload',
  FIT_PROFILE_DETAIL_RESPONSE_SCHEMA.safeParse({
    ok: true,
    profile: {
      id: 'fit_123',
      label: 'Primary profile',
      email: 'customer@example.com',
      categoryDefaults: { trouser: { size: '34' } },
      isActive: true,
      updatedAt: '2026-03-28T10:00:00.000Z',
      version: 2,
    },
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
  'add mtm item valid payload',
  ADD_MTM_ITEM_REQUEST_SCHEMA.safeParse({
    variantId: 'gid://shopify/ProductVariant/789',
    quantity: 2,
    customAttributes: {
      gjm_mtm_category: 'jacket',
      gjm_fit_profile_id: 'fit_profile_2',
    },
  }),
);

assertInvalid(
  'add mtm item empty attributes',
  ADD_MTM_ITEM_REQUEST_SCHEMA.safeParse({
    variantId: 'gid://shopify/ProductVariant/789',
    customAttributes: {},
  }),
);

// Phase 3.1: category handoff parsing regression
const query = new URLSearchParams({
  category: 'blazer',
  optionSet: 'blazer-core-v1',
  optionSetVersion: 'v1',
  mtmSelections: JSON.stringify({
    fit: 'tailored',
    lapel_type: 'peak',
    pocket_style: 'flap',
  }),
  designUpcharge: '1400',
  fabricId: 'fabric_001',
});

const handoff = parseCategoryHandoffFromQuery(query);
assert.ok(handoff, 'category handoff should parse from query');
assert.equal(handoff?.category, 'blazer', 'category handoff category should be blazer');
assert.equal(handoff?.optionSet, 'blazer-core-v1', 'category handoff should keep option set');
assert.equal(handoff?.pricing.total, 1400, 'category handoff should parse numeric upcharge');
assert.equal(handoff?.selections.fit, 'tailored', 'category handoff should preserve selections');

const invalidQuery = new URLSearchParams({
  category: 'blazer',
  optionSet: 'blazer-core-v1',
  optionSetVersion: 'v1',
  mtmSelections: 'not-json',
});
const invalidHandoff = parseCategoryHandoffFromQuery(invalidQuery);
assert.equal(invalidHandoff, null, 'invalid mtmSelections should return null handoff');

// Phase 3.1: generic cart payload shape regression
const categoryPayload = buildCategoryCartPayload({
  category: 'shirt',
  optionSet: 'shirt-core-v1',
  optionSetVersion: 'v1',
  selections: {
    fit: 'tailored',
    collar: 'cutaway',
    cuff: 'double_french',
  },
  designUpcharge: 2300,
  fitProfileId: 'fit_123',
  fitGateVersion: 'v1',
  fabricId: 'fabric_abc',
  email: 'customer@example.com',
  fitPreference: 'regular',
  appointmentDate: '2026-04-03',
  appointmentTime: '10:00 AM',
  attributes: {
    chest: '98',
    waist: '82',
    height: '182',
  },
});

assert.equal(
  categoryPayload.lineItemAttributes.gjm_mtm_category,
  'shirt',
  'generic payload should include mtm category attribute',
);
assert.equal(
  categoryPayload.lineItemAttributes.gjm_mtm_option_set,
  'shirt-core-v1',
  'generic payload should include option set attribute',
);
assert.equal(
  categoryPayload.lineItemAttributes.gjm_fit_profile_id,
  'fit_123',
  'generic payload should include fit profile id',
);
assert.ok(
  categoryPayload.lineItemAttributes.gjm_mtm_canonical.includes('"category":"shirt"'),
  'generic payload canonical blob should include category',
);

// Phase 3.1: category analytics field mapping regression
const blazerAnalytics = deriveCategoryAnalyticsFields('blazer', {
  gjm_mtm_option_set: 'blazer-core-v1',
  gjm_mtm_option_set_version: 'v1',
  gjm_design_pricing_total: '1400',
  gjm_blazer_selections: JSON.stringify({
    fit: 'tailored',
    lapel_type: 'peak',
    buttoning: 'single_two',
    pocket_style: 'flap',
  }),
});

assert.equal(blazerAnalytics.category, 'blazer', 'blazer analytics should preserve category');
assert.equal(blazerAnalytics.blazer_fit, 'tailored', 'blazer analytics should map fit');
assert.equal(blazerAnalytics.blazer_lapel_type, 'peak', 'blazer analytics should map lapel type');
assert.equal(blazerAnalytics.category_design_upcharge, '1400', 'blazer analytics should map design upcharge');

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

// A14: Canonical MTM Payload Schema Tests
assertValid(
  'mtm canonical payload minimum valid',
  MTM_CANONICAL_PAYLOAD_SCHEMA.safeParse({
    category: 'trouser',
    createdAt: new Date().toISOString(),
    fitProfile: {
      email: 'customer@example.com',
      fitPreference: 'regular',
    },
    design: null,
    mtmSpec: {
      category: 'trouser',
      options: { length: 'standard' },
      measurements: { waist: 32, length: 32 },
    },
  }),
);

assertValid(
  'mtm canonical payload maximum valid',
  MTM_CANONICAL_PAYLOAD_SCHEMA.safeParse({
    version: 'v1',
    id: 'canonical_1',
    category: 'trouser',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'designer_1',
    fitProfile: {
      email: 'customer@example.com',
      fitPreference: 'slim',
      jacketSize: 40,
      trouserSize: 32,
      appointmentDate: '2026-04-01',
      appointmentTime: '10:00 AM',
      fitProfileId: 'fit_123',
      customerId: 'cust_456',
      fitGateVersion: 'v1',
    },
    design: {
      category: 'trouser',
      optionSet: 'trouser-core-v1',
      optionSetVersion: 'v1',
      selections: { fabric: 'wool', style: 'tailored' },
      pricing: {
        total: 150.0,
        breakdown: [
          { key: 'base', label: 'Base Price', amount: 100.0 },
          { key: 'upgrade', label: 'Premium Fabric', amount: 50.0 },
        ],
      },
      validation: {
        isValid: true,
        errors: [],
      },
      createdAt: new Date().toISOString(),
    },
    fit: {
      attributes: { chest: 98, waist: 82 },
      measurements: { waist: 82, length: 100 },
    },
    mtmSpec: {
      category: 'trouser',
      fabricCode: 'WL001',
      options: { fabric: 'wool', style: 'tailored' },
      measurements: { waist: 82, length: 100 },
      notes: 'Premium tailoring',
      fitGateVersion: 'v1',
      fitProfileId: 'fit_123',
    },
    lineItemProperties: {
      gjm_mtm_category: 'trouser',
      gjm_fit_profile_id: 'fit_123',
    },
    metadata: { source: 'configure_fit_v1', timestamp: new Date().toISOString() },
  }),
);

assertInvalid(
  'mtm canonical payload missing category',
  MTM_CANONICAL_PAYLOAD_SCHEMA.safeParse({
    createdAt: new Date().toISOString(),
    fitProfile: { email: 'test@example.com', fitPreference: 'regular' },
    mtmSpec: {
      category: 'trouser',
      options: {},
      measurements: { waist: 32 },
    },
  }),
);

assertInvalid(
  'mtm canonical payload missing fit profile email',
  MTM_CANONICAL_PAYLOAD_SCHEMA.safeParse({
    category: 'trouser',
    createdAt: new Date().toISOString(),
    fitProfile: { fitPreference: 'regular' },
    mtmSpec: {
      category: 'trouser',
      options: {},
      measurements: { waist: 32 },
    },
  }),
);

assertValid(
  'mtm canonical strict payload with required fields',
  MTM_CANONICAL_PAYLOAD_STRICT_SCHEMA.safeParse({
    version: 'v1',
    id: 'canonical_1',
    category: 'trouser',
    createdAt: new Date().toISOString(),
    fitProfile: {
      email: 'customer@example.com',
      fitPreference: 'regular',
    },
    design: null,
    mtmSpec: {
      category: 'trouser',
      options: {},
      measurements: { waist: 32 },
    },
  }),
);

// Test validator functions
const validPayload = {
  version: 'v1',
  id: 'test_1',
  category: 'trouser',
  createdAt: new Date().toISOString(),
  fitProfile: {
    email: 'test@example.com',
    fitPreference: 'regular',
    fitProfileId: 'fit_1',
  },
  design: {
    category: 'trouser',
    optionSet: 'trouser-v1',
    optionSetVersion: 'v1',
    selections: {},
    pricing: { total: 0 },
  },
  mtmSpec: {
    category: 'trouser',
    options: {},
    measurements: { waist: 32, length: 32 },
  },
};

assert.equal(validateCanonicalPayload(validPayload).ok, true, 'valid payload should validate');
assert.equal(
  validateCanonicalPayloadForPersistence(validPayload).ok,
  true,
  'valid payload should pass persistence validation',
);
assert.equal(
  validatePayloadWithVersionCheck(validPayload).ok,
  true,
  'valid payload should pass version check',
);
assert.equal(
  isPayloadReadyForCommerce(validPayload),
  true,
  'valid payload should be ready for commerce',
);
assert.equal(
  isPayloadReadyForFulfilment(validPayload),
  true,
  'valid payload should be ready for fulfilment',
);

console.log('API contract schemas: regression checks passed');