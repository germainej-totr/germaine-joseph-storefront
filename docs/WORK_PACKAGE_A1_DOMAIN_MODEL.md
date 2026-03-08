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
| `gjc.mtm_required`            | `boolean` | Marks a product as made‑to‑measure. Value: `true` for MTM categories. |
| `gjc.mtm_category`            | `single_line_text_field` | MTM category name (e.g. "Business Suit"). Used for fit/booking routing. |
| `gjc.mtm_base_block`          | `single_line_text_field` | Identifier for base pattern used in production. |
| `gjc.mtm_customization_schema`| `json`  | Full metadata object containing available customisation options (lapels, vents, linings, etc.). |

### Collection Metafields

| namespace.key | type    | description |
|---------------|---------|-------------|
| `mtm.filter_tags` | `multi_line_text_field` | Comma‑separated tags used on PLP filters (e.g. "wedding, business"). |

### Metaobjects (for options sets)

A metaobject type `mtm_option` defines reusable option sets for styling.

Fields:
- `option_type`: string (e.g. "lapel", "vent", "pocket")
- `value`: string
- `label`: string
- `image`: file reference (optional)
- `category`: string (e.g. "suit", "shirt")

### Customer Metafields

| namespace.key     | type | description |
|------------------|------|-------------|
| `fit_profile_id` | `single_line_text_field` | ID of the primary `FitProfile` record in our database. |
| `preferred_size` | `string` | human‑readable saved size name ("My Size"). |

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
