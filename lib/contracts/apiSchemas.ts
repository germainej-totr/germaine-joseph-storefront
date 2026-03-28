import { z } from 'zod';

export const SERVICE_TYPE_ID_SCHEMA = z.enum([
  'home_office',
  'showroom',
  'virtual',
  'video_consult',
  'tailor_fitting',
]);

export const MTM_CATEGORY_SCHEMA = z.enum([
  'suit',
  'shirt',
  'trouser',
  'overcoat',
  'blazer',
  'vest',
]);

export const SERVICE_TYPE_OPTION_SCHEMA = z.object({
  id: SERVICE_TYPE_ID_SCHEMA,
  handle: z.string().min(1, 'handle is required'),
  label: z.string().min(1, 'label is required'),
  durationMin: z.number().finite().nonnegative(),
  depositAmount: z.number().finite().nonnegative(),
  leadTimeHours: z.number().finite().nonnegative(),
  travelRequired: z.boolean(),
  slots: z.array(z.string().min(1)).optional(),
  zones: z
    .object({
      radius_km: z.number().finite().optional(),
      flat_fee: z.number().finite().optional(),
    })
    .optional(),
});

export const BOOKING_SERVICE_TYPE_CATALOG_RESPONSE_SCHEMA = z.object({
  serviceTypes: z.array(SERVICE_TYPE_OPTION_SCHEMA),
  error: z.string().optional(),
});

export const AVAILABILITY_REQUEST_SCHEMA = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  serviceType: SERVICE_TYPE_ID_SCHEMA.optional(),
});

export const CONFIRM_REQUEST_SCHEMA = z.object({
  serviceType: SERVICE_TYPE_ID_SCHEMA,
  location: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  timeSlot: z.string().min(1, 'timeSlot is required'),
  customerName: z.string().optional(),
  customerEmail: z.string().email('customerEmail must be a valid email'),
  notes: z.string().optional(),
  lat: z.number().finite().optional(),
  lng: z.number().finite().optional(),
});

export const BOOKING_UPDATE_REQUEST_SCHEMA = z
  .object({
    action: z.enum(['cancel', 'reschedule', 'update']),
    serviceType: SERVICE_TYPE_ID_SCHEMA.optional(),
    location: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format').optional(),
    timeSlot: z.string().min(1, 'timeSlot is required').optional(),
    notes: z.string().optional(),
    lat: z.number().finite().optional(),
    lng: z.number().finite().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === 'reschedule' && (!value.date || !value.timeSlot)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'date and timeSlot are required when action=reschedule',
        path: ['date'],
      });
    }
  });

export const RESCHEDULE_AVAILABILITY_QUERY_SCHEMA = z.object({
  bookingId: z.string().min(1, 'bookingId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  serviceType: SERVICE_TYPE_ID_SCHEMA.optional(),
});

export const RESCHEDULE_BOOKING_REQUEST_SCHEMA = z.object({
  bookingId: z.string().min(1, 'bookingId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  timeSlot: z.string().min(1, 'timeSlot is required'),
  serviceType: SERVICE_TYPE_ID_SCHEMA.optional(),
  location: z.string().optional(),
  lat: z.number().finite().optional(),
  lng: z.number().finite().optional(),
});

export const CART_ADD_REQUEST_SCHEMA = z.object({
  productId: z.string().optional(),
  variantId: z.string().min(1, 'variantId is required'),
  quantity: z.number().int().positive().optional(),
  productFlow: z.enum(['ready_to_wear', 'configurable_non_tailor', 'mtm_tailored']).optional(),
  fitProfileId: z.string().optional(),
  mtmSpec: z
    .object({
      category: MTM_CATEGORY_SCHEMA,
      fabricCode: z.string().optional(),
      options: z.record(z.string(), z.string()),
      measurements: z.record(z.string(), z.number().finite()),
      notes: z.string().optional(),
      fitGateVersion: z.string().optional(),
      fitProfileId: z.string().optional(),
    })
    .optional(),
  mtmOptions: z.record(z.string(), z.string()).optional(),
  measurements: z.record(z.string(), z.number().finite()).optional(),
  fitGateVersion: z.string().optional(),
  customAttributes: z.record(z.string(), z.string()).optional(),
});

export const ADD_MTM_TROUSER_REQUEST_SCHEMA = z.object({
  variantId: z.string().min(1, 'variantId is required'),
  quantity: z.number().int().positive().optional(),
  customAttributes: z.record(z.string(), z.string()).refine(
    (value) => Object.keys(value).length > 0,
    'customAttributes cannot be empty',
  ),
  metadata: z
    .object({
      source: z.string().optional(),
      timestamp: z.string().optional(),
    })
    .optional(),
});

export type AddMtmTrouserRequest = z.infer<typeof ADD_MTM_TROUSER_REQUEST_SCHEMA>;