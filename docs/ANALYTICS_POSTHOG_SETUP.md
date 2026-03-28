# PostHog Analytics Dashboard Setup

This guide explains how to set up PostHog analytics dashboards for GJM storefront funnel tracking.

## Available Dashboard Packs

### 1. MTM Gate Performance Pack (`gjm-mtm-gate-v1`)
**Location:** `lib/analytics/posthogMtmDashboardPack.ts`

Tracks decision outcomes for MTM-required catalog products:
- Gate decision mix (full MTM, saved fit, refit, etc.)
- Saved-fit acceptance rate
- Refit recommendation frequency
- Modal action split (saved fit vs. new fitting)
- Full-MTM start ratio

**Key Events Tracked:**
- `gjm_gate_full_mtm_required`
- `gjm_gate_saved_fit_eligible`
- `gjm_gate_refit_recommended`
- `gjm_use_saved_fit_clicked`
- `gjm_start_new_fitting_clicked`

---

### 2. Non-Tailor Configurator Funnel Pack (`gjm-non-tailor-config-v1`)
**Location:** `lib/analytics/posthogNonTailorConfiguratorPack.ts`

Tracks engagement and conversion for shoes, leather, and other configurable non-tailor categories:
- Funnel: View → Option Change → Add to Cart
- View trends by product/category
- Option change frequency and adoption
- View-to-add-to-cart conversion rate
- Custom notes adoption rate
- Average options selected per add

**Key Events Tracked:**
- `gjm_non_tailor_config_view`
- `gjm_non_tailor_config_option_change`
- `gjm_non_tailor_config_add_to_cart`

---

### 3. MTM Funnel Intelligence Pack (`gjm-mtm-funnel-v1`)
**Location:** `lib/analytics/posthogMtmFunnelDashboardPack.ts`

Tracks end-to-end MTM funnel conversion and drop-off:
- Configurator start -> fit completion -> booking -> cart -> checkout -> order completion
- Option change intensity
- Saved-fit vs full-MTM performance comparison
- Booking-to-order drop-off
- Category-level conversion comparison

**Key Events Tracked:**
- `gjm_mtm_configurator_start`
- `gjm_mtm_option_change`
- `gjm_mtm_fit_completion`
- `gjm_mtm_booking_created`
- `gjm_mtm_deposit_paid`
- `gjm_mtm_cart_add`
- `gjm_mtm_checkout_start`
- `gjm_mtm_order_completed`

---

## Manual Setup in PostHog

### Step 1: Create Custom Events (if not auto-captured)
Go to **Data Management → Events** in PostHog and ensure these events exist:

**MTM Gate Events:**
- `gjm_gate_full_mtm_required`
- `gjm_gate_saved_fit_eligible`
- `gjm_gate_refit_recommended`
- `gjm_gate_unauthenticated`
- `gjm_gate_profile_not_owned`
- `gjm_use_saved_fit_clicked`
- `gjm_start_new_fitting_clicked`
- `gjm_saved_fit_modal_shown`
- `gjm_refit_recommended_modal_shown`

**Non-Tailor Configurator Events:**
- `gjm_non_tailor_config_view`
- `gjm_non_tailor_config_option_change`
- `gjm_non_tailor_config_add_to_cart`

### Step 2: Create Dashboard
1. Go to **Dashboards → New Dashboard**
2. Name: `GJM Funnel Analysis`
3. Description: `Storefront conversion and decision funnels`

### Step 3: Add MTM Gate Insights

**Insight 1: Gate Decision Mix**
- Type: Trends
- Events: `gjm_gate_full_mtm_required`, `gjm_gate_saved_fit_eligible`, `gjm_gate_refit_recommended`, `gjm_gate_unauthenticated`, `gjm_gate_profile_not_owned`
- Breakdown by: mtm_category, product_handle
- Time: Last 30 days

**Insight 2: Saved-Fit Acceptance Funnel**
- Type: Funnel
- Steps: 
  1. `gjm_gate_saved_fit_eligible`
  2. `gjm_use_saved_fit_clicked`
- Breakdown by: mtm_category, product_handle
- Time: Last 30 days

**Insight 3: Modal Action Split**
- Type: Funnel
- Steps:
  1. `gjm_saved_fit_modal_shown` OR `gjm_refit_recommended_modal_shown`
  2. `gjm_use_saved_fit_clicked` OR `gjm_start_new_fitting_clicked`
- Breakdown by: mtm_category
- Time: Last 30 days

### Step 4: Add Non-Tailor Configurator Insights

**Insight 1: Configurator Funnel**
- Type: Funnel
- Steps:
  1. `gjm_non_tailor_config_view`
  2. `gjm_non_tailor_config_option_change`
  3. `gjm_non_tailor_config_add_to_cart`
- Breakdown by: product_handle, mtm_category
- Time: Last 30 days

**Insight 2: View Trends**
- Type: Trends
- Events: `gjm_non_tailor_config_view`
- Breakdown by: mtm_category, product_type
- Time: Last 30 days

**Insight 3: View-to-Cart Conversion**
- Type: Funnel
- Steps:
  1. `gjm_non_tailor_config_view`
  2. `gjm_non_tailor_config_add_to_cart`
- Breakdown by: mtm_category, product_handle
- Time: Last 30 days

**Insight 4: Custom Notes Adoption**
- Type: Trends
- Events: `gjm_non_tailor_config_add_to_cart`
- Breakdown by: mtm_category
- Filter: `custom_notes_present = true`
- Time: Last 30 days

---

## Programmatic Dashboard Setup (Future)

The dashboard packs can be used programmatically to:
- Auto-seed PostHog dashboards during onboarding
- Generate dashboard JSON for version control
- Build a dashboard templates library

Example:
```typescript
import { NON_TAILOR_CONFIGURATOR_DASHBOARD_PACK } from '@/lib/analytics/posthogNonTailorConfiguratorPack';

// Later: build insights from blocks
const blocks = NON_TAILOR_CONFIGURATOR_DASHBOARD_PACK.blocks;
const funnelBlock = blocks[0]; // View → Change → Add funnel
```

---

## Key Metrics to Monitor

### MTM Gate
- **Saved-Fit Acceptance Rate**: Target > 60% (reduced fitting flow)
- **Full MTM Required Rate**: Baseline tracking (new customer rate)
- **Refit Recommendation Rate**: Target < 15% (good profile quality)

### Non-Tailor Configurator
- **View-to-Add Conversion**: Target > 40%
- **Custom Notes Adoption**: Target > 25%
- **Funnel Drop-Off**: Identify bottlenecks at option-change step
- **Average Options per Add**: Sanity check that options are being configured

---

## Testing Analytics Locally

1. Start the development server: `npm run dev`
2. Visit a non-tailor configurable product page (e.g., shoes)
3. Open browser DevTools → Network tab
4. Interact with the configurator (select options, add to cart)
5. Verify POST requests to `/api/analytics/non-tailor-config`
6. Check PostHog ingestion in the Events Inspector within 30 seconds

---

## Troubleshooting

**Events not appearing in PostHog:**
1. Verify `POSTHOG_API_KEY` and `POSTHOG_HOST` are set
2. Check browser console for fetch errors
3. Confirm distinction ID is properly resolved (fit_profile_id or anonymous)
4. In PostHog, check **Events** tab for event count and sampling

**Funnel not creating as expected:**
1. Ensure step events are in correct order
2. Verify event names match exactly (case-sensitive)
3. Check that properties/breakdowns are available on events (inspect 1-2 raw events in PostHog Events Inspector)

---

## References

- PostHog API Docs: https://posthog.com/docs/api
- PostHog Events Inspector: https://posthog.com/docs/data/events
- Funnel Analysis: https://posthog.com/docs/product/funnels
