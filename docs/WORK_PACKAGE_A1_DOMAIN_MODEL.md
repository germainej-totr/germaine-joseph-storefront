# Work Package A1: Domain Model & Metafield Schema

This document defines the foundation for the Tailor On The Road headless storefront,
reflecting the "Proper Cloth–style" MTM experience described in the architecture.
It covers:

1. Prisma data models (Postgres)
2. Shopify metafield/metaobject schema required for MTM workflows

---

## 1. Prisma Domain Model

The database persists all user-generated data that cannot or should not live in Shopify:
fit profiles, measurements, bookings, design/spec sessions, and production handovers.

### Customer
Represents a unified identity linked to Shopify customer. One customer may have
multiple fit profiles (e.g. one per family member).

```prisma
model Customer {
  id          String       @id @default(uuid())
  shopifyId   String       @unique
  email       String       @unique
  fitProfiles FitProfile[]
  createdAt   DateTime     @default(now())
}
```

### FitProfile
Core record for a user’s sizing/fit information. Profiles may be created via
Smart Fit wizard, manual measurements, or through a booking.

Fields capture high-level preferences (jacketSize, trouserSize, fitPreference)
and store related measurements, bookings, etc. A fit profile can be saved
as “My Size” and reused across orders.

```prisma
model FitProfile {
  id              String           @id @default(cuid())
  email           String           @unique
  profile_name    String?
  jacketSize      String?
  trouserSize     String?
  fitPreference   String?
  appointmentTime String?
  technicalSpecs  Json?
  isActive        Boolean          @default(true)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  // Relations
  customerId      String?
  customer        Customer?        @relation(fields: [customerId], references: [id])
  measurements    FitMeasurement[]
  bookings        Booking[]
  specs           ProductionSpec[]
  fittingSessions FittingSession[]
}
```

### FitMeasurement
Versioned anatomical data tied to a profile. Category identifies garment type or
measurement set (e.g. "jacket", "shirt").

```prisma
model FitMeasurement {
  id           String     @id @default(uuid())
  fitProfileId String
  fitProfile   FitProfile @relation(fields: [fitProfileId], references: [id], onDelete: Cascade)
  category     String
  data         Json
  source       String?
  confidence   Int        @default(0)
  version      Int        @default(1)
  createdAt    DateTime   @default(now())
}
```

### FittingSession
Used primarily by the Unified Tailors Dashboard to track the lifecycle of a
garment from order through production.

```prisma
model FittingSession {
  id               String        @id @default(cuid())
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  shopifyOrderId   String        @unique
  productionLine   String
  jacketBaseBlock  String?
  trouserBaseBlock String?
  masterFitType    String?
  measurements     Json
  tailorName       String?
  customerEmail    String
  status           FittingStatus @default(DRAFT)
  fitProfileId     String?
  fitProfile       FitProfile?   @relation(fields: [fitProfileId], references: [id])

  @@map("fitting_sessions")
}

enum FittingStatus {
  DRAFT
  ORDERED
  IN_PRODUCTION
  SHIPPED
  DELIVERED
}
```

### Booking
Captures tailor appointment data used for availability search, deposits, and
integration with Klaviyo.

```prisma
model Booking {
  id               String      @id @default(uuid())
  email            String
  serviceType      String
  startAt          DateTime
  location         Json
  status           String      @default("confirmed")
  fitProfileId     String?
  fitProfile       FitProfile? @relation(fields: [fitProfileId], references: [id])
  notes            String?
  suggestedJacket  String?
  suggestedTrouser String?
  tailorNotes      String?
  createdAt        DateTime    @default(now())
}
```

### ProductionSpec
Used to handoff manufacturing details to the workshop; derived from cart
line item properties when an order is placed.

```prisma
model ProductionSpec {
  id           String     @id @default(uuid())
  orderId      String
  fitProfileId String
  fitProfile   FitProfile @relation(fields: [fitProfileId], references: [id])
  spec         Json
  status       String     @default("queued")
  createdAt    DateTime   @default(now())
}
```


## 2. Shopify Metafield & Metaobject Schema

These definitions are stored on Shopify and consumed by the frontend via the
Storefront API. They drive the MTM gating logic and customization options.

### Product Metafields

| namespace.key              | type    | description |
|---------------------------|---------|-------------|
| `gjm.required_fit_gate`       | `boolean` | Marks product as fit-gate required for MTM flow. |
| `gjm.mtm_category`            | `single_line_text_field` | MTM category name (e.g. "Business Suit"). Used for fit/booking routing. |
| `gjm.option_set`              | `metaobject_reference` | Reference to `gjm_option_set` metaobject for configurator options. |
| `gjm.fabric_ref`              | `metaobject_reference` | Reference to selected fabric record (`gjm_fabric`). |
| `gjm.measurement_guide`       | `metaobject_reference` | Reference to `gjm_measurement_guide` for guided measuring UI. |
| `gjm.lead_time_days`          | `number_integer` | Lead time override in days. |
| `gjm.base_pattern_code`       | `single_line_text_field` | Identifier for base pattern used in production. |
| `gjm.price_model`             | `single_line_text_field` | Pricing mode (e.g. `base_plus_options`, `all_in`). |

### Collection Metafields

| namespace.key | type    | description |
|---------------|---------|-------------|
| `gjm.filter_facets` | `json` | Facet/filter configuration used by PLP for MTM discovery. |
| `gjm.collection_type` | `single_line_text_field` | Collection behavior type (e.g. `mtm`, `shop`). |
| `gjm.default_collection_set_ref` | `metaobject_reference` | Default `gjm_option_set` for products that do not override option set. |

### Customer Metafields

| namespace.key | type | description |
|------------------|------|-------------|
| `gjm_fit.height_cm` | `number_decimal` | Customer height in centimeters. |
| `gjm_fit.weight_kg` | `number_decimal` | Customer weight in kilograms. |
| `gjm_fit.body_build` | `single_line_text_field` | Body build descriptor (e.g. Athletic). |
| `gjm_fit.fit_posture` | `single_line_text_field` | Posture profile used for fitting logic. |
| `gjm_fit.fit_shoulder_slope` | `single_line_text_field` | Shoulder slope indicator. |
| `gjm_fit.fit_preference` | `single_line_text_field` | Preferred silhouette/fit style. |
| `gjm_fit.primary_use_case` | `single_line_text_field` | Style intent (e.g. Business, Wedding). |
| `gjm_fit.event_date` | `date` | Event date such as wedding date. |
| `gjm_fit.timeline_urgency` | `single_line_text_field` | Production timeline urgency code. |
| `gjm_fit.preferred_fitting_mode` | `single_line_text_field` | Preferred appointment mode. |
| `gjm_fit.consent_profile_storage` | `boolean` | Consent flag for profile data storage. |
| `gjm_fit.fit_gate_version` | `single_line_text_field` | Fit Gate version used during capture. |
| `gjm_fit.tailor_notes` | `multi_line_text_field` | Notes from customer to tailor. |
| `gjm_fit.fit_issues` | `multi_line_text_field` | Known fit issues and concerns. |
| `gjm_fit.trouser_break_preference` | `single_line_text_field` | Trouser break preference. |
| `gjm_fit.trouser_rise_preference` | `single_line_text_field` | Trouser rise preference. |
| `gjm_fit.current_sizes_json` | `json` | Known size history/snapshot. |
| `gjm_fit.jacket_length_preference` | `single_line_text_field` | Jacket length preference. |
| `gjm_fit.fit_gate_completed_at` | `date_time` | Timestamp when fit gate was completed. |
| `gjm_fit.fit_gate_status` | `single_line_text_field` | Fit gate state marker for journey logic. |

### Order Metafields

| namespace.key | type | description |
|------------------|------|-------------|
| `gjm_fit.fit_gate_completed_at` | `date_time` | Fit gate completion timestamp copied onto order. |
| `gjm_fit.fit_gate_version` | `single_line_text_field` | Fit gate version used for the order. |
| `gjm_fit.fit_gate_snapshot` | `json` | Immutable fit gate snapshot for audit/production context. |

### Metaobjects

Production metaobject definitions in use:

- `gjm_measurement_guide`
- `gjm_service_type`
- `gjm_choice`
- `gjm_fabric`
- `gjm_option`
- `gjm_option_set`

### Cart Line Item Properties

When adding an MTM product to cart, the frontend includes:
- `fit_profile_id`: references the DB profile
- `measurements`: JSON snapshot of measurements used
- `customizations`: JSON of selected options
- `mtm_category`: string
- `production_spec`: JSON blob for workshop

---

These models and schemas form the foundation for all work packages that follow.
With them in place, we can implement PLP/PDP gating, booking flows, dashboard
tracking, and order webhook handling.

Next: convert these definitions into actual database migrations and
Shopify metafield configuration scripts.  

*End of Work Package A1.*
