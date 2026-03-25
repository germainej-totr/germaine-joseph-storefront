# Non-Tailor Configurator Analytics: Execution Guide

This guide walks through executing the recommended first actions for the Non-Tailor Configurator analytics implementation.

## ✅ Status: Pipeline Verification Complete

All 18 analytics pipeline checks passed:
- ✅ 5/5 required files created
- ✅ 3/3 API routes integrated
- ✅ 3/3 event types defined
- ✅ 4/4 PDP instrumentation points added
- ✅ 3/3 dashboard pack blocks configured

---

## Priority 1: Local Testing

### Objective
Verify that analytics events are firing correctly from the PDP to your PostHog instance.

### Execution Steps

#### Step 1: Start Development Server
```bash
npm run dev
```

You should see:
```
> next dev
  ▲ Next.js 16.1.1
  - Local:        http://localhost:3000
```

#### Step 2: Access a Non-Tailor Configurable Product

1. Navigate to: `http://localhost:3000/product/shoes-oxford` (or similar shoes/leather product handle)
2. The PDP should load with:
   - Product thumbnail/description
   - **Configuration** section with option selectors
   - **Customization notes** textarea
   - **"Customize & Add to Cart"** button (for non-tailor items)

**Expected: First event fires**
- Event: `gjm_non_tailor_config_view`
- PostHog ingestion: within 30 seconds

#### Step 3: Monitor Network Activity

1. Open DevTools: **F12** or **Ctrl+Shift+K**
2. Go to **Network** tab
3. Filter: search for `analytics`
4. Ensure **Request type** shows `fetch`

#### Step 4: Interact with Configurator

Perform these actions in order and observe network requests:

**Action A: Change an Option**
```
Expected Network Request:
POST /api/analytics/non-tailor-config
Body: {
  "event_name": "gjm_non_tailor_config_option_change",
  "option_name": "size",
  "option_value": "10",
  "selected_options_count": 1,
  ...
}
```

**Action B: Type Custom Notes**
```
Expected: No network request (handled in batch on add-to-cart)
```

**Action C: Click "Customize & Add to Cart"**
```
Expected Network Request:
POST /api/analytics/non-tailor-config
Body: {
  "event_name": "gjm_non_tailor_config_add_to_cart",
  "selected_options_count": 1,
  "custom_notes_present": true,
  ...
}

Then:
POST /api/cart/add
Body: {
  "productFlow": "configurable_non_tailor",
  "customAttributes": [
    { "key": "gjm_config_option_size", "value": "10" },
    { "key": "gjm_custom_notes", "value": "..." }
  ]
}
```

#### Step 5: Verify PostHog Ingestion

1. Log in to PostHog: https://app.posthog.com
2. Navigate to **Events** (left sidebar)
3. In the **Events Inspector**:
   - Look for event names starting with `gjm_non_tailor`
   - Filter by time: **Last 1 minute**
   - You should see 3 events (view, option_change, add_to_cart) within 30 seconds

4. Click on an event to inspect its properties:
   - Verify `product_handle`, `mtm_category`, `variant_id` are present
   - Confirm `source: "gjm_non_tailor_configurator"` tag

**Success Indicator:** 3+ events in PostHog Events Inspector within 1 minute of action.

---

## Priority 2: PostHog Dashboard Seeding

### Objective
Create pre-configured dashboards and funnels in PostHog for immediate conversion tracking.

### Prerequisites

1. **PostHog API Key**
   - Go to: https://app.posthog.com/settings/project-api-keys
   - Copy your **Personal API Key**

2. **Environment Variables**
   Create or update `.env.local`:
   ```
   POSTHOG_API_KEY=your_api_key_here
   POSTHOG_HOST=https://app.posthog.com
   ```

### Execution Steps

#### Step 1: Run Dashboard Seeder

```bash
npm run seed:posthog-dashboards
```

Expected output:
```
🚀 Starting PostHog dashboard seeding...

📊 Creating Non-Tailor Configurator dashboard...
✅ Dashboard created (ID: 12345)

📈 Adding insights to Non-Tailor Configurator dashboard...

  ✅ Configurator Funnel: View → Change → Add to Cart
  ✅ Configurator View Trends
  ✅ Option Change Frequency
  ✅ View to Add-to-Cart Conversion Rate
  ✅ Custom Notes Adoption Rate
  ✅ Average Options Selected Per Add

✅ Added 6 insights to Non-Tailor Configurator dashboard

...

🎉 Dashboard seeding complete!

View your dashboards at:
  - Non-Tailor Configurator: https://app.posthog.com/dashboard/12345
  - MTM Gate Performance: https://app.posthog.com/dashboard/12346
```

#### Step 2: Access Your Dashboard

1. Click the provided dashboard link or navigate to: https://app.posthog.com/dashboards
2. Select **"GJM Non-Tailor Configurator Funnel"**
3. You should see 6 insights (currently empty until events populate)

#### Step 3: Generate Events for Dashboard

Repeat **Priority 1 Steps 2-4** to generate fresh events while watching:

1. In PostHog dashboard, click **⟳ Refresh** (top-right)
2. Within 30-60 seconds, metrics should appear:
   - **Configurator Funnel**: View → Change → Add to Cart (step-by-step conversion)
   - **View Trends**: Count of `gjm_non_tailor_config_view` events over time
   - **Option Change Frequency**: Breakdown by option_name
   - **View-to-Cart Conversion**: Percentage conversion (100% if you completed flow)
   - **Custom Notes Adoption**: % of add-to-carts with notes (50-100% depending on data)
   - **Average Options**: Count of options configured per add action

---

## Priority 3: Conversion Monitoring

### Key Metrics

Once your dashboard has 30+ events, monitor these KPIs:

| Metric | Target | What It Means |
|--------|--------|---------------|
| **View → Add-to-Cart Conversion** | > 40% | Non-tailor configurators are effective |
| **View Count Trend** | Growing | Product discoverability is working |
| **Option Change Frequency** | High variance | Some options are more interesting |
| **Custom Notes Adoption** | > 25% | Customers want personalization |
| **Funnel Drop-Off** | < 60% at step 2 | No major engagement cliff |

### Monitoring Workflow (Weekly)

1. Open Non-Tailor Configurator dashboard every Monday
2. Check conversion rate and event volume
3. If conversion drops > 5%, identify the issue:
   - Are products showing options? (check PDP)
   - Are analytics events firing? (check network tab)
   - Is PostHog connected? (check `/api/analytics/non-tailor-config` logs)

### Adjustments Based on Data

**If View-to-Add drops:**
- Review option UI/UX
- Check for product stock issues
- Verify custom notes aren't confusing users

**If Option Change is low:**
- Options may not be clear
- Consider adding descriptions
- Check if products actually have multiple options

**If Custom Notes Adoption is high (> 60%):**
- Great! Customers want personalization
- Consider highlighting this feature more
- Use notes in post-purchase follow-up

---

## Troubleshooting

### Events Not Appearing in PostHog

**Check 1: API Key Configured**
```bash
echo $POSTHOG_API_KEY
```
Expected: Your API key is printed (if set)

**Check 2: Network Requests Reaching /api/analytics**
1. Open DevTools Network tab
2. Look for POST requests to `/api/analytics/non-tailor-config`
3. Check response status (should be 200)

**Check 3: PostHog API Connectivity**
```bash
curl -X POST https://app.posthog.com/capture/ \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_API_KEY",
    "event": "test_event",
    "distinct_id": "test_user",
    "timestamp": "'$(date -u +'%Y-%m-%dT%H:%M:%SZ')'"
  }'
```
Expected: HTTP 200 response

### Dashboard Seeding Fails

**Error: "invalid_payload"**
- Check event names match exactly (case-sensitive)
- Verify properties are correctly spelled

**Error: "posthog_api_unreachable"**
- Confirm `POSTHOG_HOST` is set to `https://app.posthog.com`
- Check internet connectivity

---

## Commands Reference

```bash
# Verify analytics pipeline
npm run verify:analytics

# Seed PostHog dashboards
npm run seed:posthog-dashboards

# Start dev server for testing
npm run dev

# View type errors
npx tsc --noEmit
```

---

## Success Checklist

- [ ] Analytics pipeline verification passed (18/18 checks)
- [ ] Development server runs without errors
- [ ] Can navigate to non-tailor product page
- [ ] Configurator UI renders with options
- [ ] Network requests appear in DevTools for each action
- [ ] Events appear in PostHog Events Inspector within 30 seconds
- [ ] Dashboard seeder runs successfully
- [ ] PostHog dashboards display with 2+ insights populated
- [ ] View-to-cart funnel shows data
- [ ] Conversion rate is calculated and displayed

---

## Next Steps After Verification

1. **Week 1**: Monitor baseline metrics
   - Are we capturing 100+ events/day?
   - What's the view-to-add conversion?

2. **Week 2**: Tune thresholds
   - Adjust targets based on benchmark data
   - Add alerts for drops > 10%

3. **Month 1**: Expand analytics
   - Add cart-to-checkout metrics
   - Integrate order completion tracking
   - Build retention cohorts

---

## Support & Documentation

- **PostHog Docs**: https://posthog.com/docs
- **Dashboard Packs**: `lib/analytics/posthogNonTailorConfiguratorPack.ts`
- **Analytics Setup Guide**: `docs/ANALYTICS_POSTHOG_SETUP.md`
- **Event Contracts**: `lib/analytics/nonTailorConfiguratorContract.ts`
