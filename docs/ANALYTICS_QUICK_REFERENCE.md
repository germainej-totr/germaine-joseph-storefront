# Analytics Quick Reference

## 🚀 Quick Start (5 minutes)

```bash
# 1. Verify everything is set up
npm run verify:analytics

# 2. Start dev server
npm run dev

# 3. Test: visit http://localhost:3000/product/shoes-oxford
# 4. Open DevTools (F12) → Network tab, filter "analytics"
# 5. Interact with configurator and watch for POST requests

# 6. Seed dashboards (after confirming events in PostHog)
npm run seed:posthog-dashboards
```

---

## 📊 Key Metrics at a Glance

### Non-Tailor Configurator Funnel
```
View        → Option Change → Add to Cart
100%          ~80%              40-60%
Baseline      Normal churn      Target conversion
```

### What Success Looks Like
| Metric | Value | Status |
|--------|-------|--------|
| Events/day | 50+ | ✅ Launch ready |
| View→Add conversion | >40% | ✅ Healthy |
| Custom notes % | >25% | ✅ Personalization interest |
| Option changes/view | >0.6 | ✅ Engagement |

---

## 🔍 Event Types Tracked

### View Event (fires once per page load)
```
gjm_non_tailor_config_view
├─ product_handle: "shoes-oxford"
├─ mtm_category: "footwear"
├─ variant_id: "gid://shopify/..."
└─ selected_options_count: 0
```

### Option Change (fires on select change)
```
gjm_non_tailor_config_option_change
├─ product_handle: "shoes-oxford"
├─ option_name: "size" or "color"
├─ option_value: "10" or "brown"
└─ selected_options_count: 1
```

### Add to Cart (fires on CTA click)
```
gjm_non_tailor_config_add_to_cart
├─ product_handle: "shoes-oxford"
├─ selected_options_count: 2
├─ custom_notes_present: true
└─ variant_id: "gid://shopify/..."
```

---

## 🛠️ Troubleshooting Checklist

**Events not in PostHog?**
1. ✅ Check POSTHOG_API_KEY is set and valid
2. ✅ Network tab shows POST to /api/analytics/non-tailor-config (status 200)
3. ✅ Wait 30 seconds, refresh PostHog Events Inspector
4. ✅ Check PostHog project is correct (Settings → Project settings)

**Dashboard shows no data?**
1. ✅ Dashboard seeder ran successfully
2. ✅ Refreshed PostHog dashboard (click ⟳)
3. ✅ Events are appearing in Events Inspector
4. ✅ Time range is set to "Last 24 hours" or "Today"

**PDP not showing configurator?**
1. ✅ Product `mtm_category` includes "shoe" or "leather"
2. ✅ Product has Shopify options (size, color, etc)
3. ✅ Check browser console for fetch errors
4. ✅ Verify `/api/products/[handle]` returns options in GraphQL response

---

## 📈 Dashboard Insights Mapping

| Dashboard Card | Event(s) | Use Case |
|---|---|---|
| View → Change → Add Funnel | view, option_change, add_to_cart | Top-level conversion |
| View Trends | view | Discovery/traffic volume |
| Option Change Freq | option_change | Which options are popular? |
| View→Add Conversion | view + add_to_cart | Simplified conversion rate |
| Custom Notes % | add_to_cart (filtered) | Personalization demand |
| Avg Options/Add | add_to_cart (aggregated) | Complexity level |

---

## 💾 File Reference

```
lib/analytics/
├── nonTailorConfiguratorContract.ts  ← Event names & types
├── trackNonTailorConfiguratorEvent.ts  ← Client caller
├── posthogNonTailorConfiguratorPack.ts  ← Dashboard spec
└── dashboardPacks.ts  ← Index

app/api/analytics/
└── non-tailor-config/route.ts  ← API endpoint (Zod + PostHog)

app/product/[handle]/
└── page.tsx  ← Instrumentation points (4 calls)

docs/
├── ANALYTICS_POSTHOG_SETUP.md  ← Manual setup guide
├── EXECUTE_ANALYTICS_RECOMMENDATIONS.md  ← Full execution guide
└── (this file)

scripts/
├── verifyAnalyticsPipeline.mjs  ← Validation (18/18 checks)
└── seedPostHogDashboard.mjs  ← Dashboard auto-creation
```

---

## 🎯 Recommended vs. Completed

| Item | Status | Evidence |
|------|--------|----------|
| Analytics contract defined | ✅ Done | `nonTailorConfiguratorContract.ts` |
| Client tracker implemented | ✅ Done | `trackNonTailorConfiguratorEvent.ts` |
| API route created | ✅ Done | `app/api/analytics/non-tailor-config/route.ts` |
| PDP instrumented | ✅ Done | 4 events firing (view, option_change, add, etc) |
| Dashboard pack spec | ✅ Done | 6 insights pre-configured |
| Pipeline verified | ✅ Done | 18/18 checks passed |
| Local testing ready | ✅ Done | Dev server can run |
| Dashboard seeder script | ✅ Done | `npm run seed:posthog-dashboards` |
| **→ Copy insights into PostHog** | ⏳ Now | Run seeder script + monitor |
| **→ Monitor view→add funnel** | ⏳ Now | Open dashboard, watch metrics |
| **→ Track option frequency** | ⏳ Now | See "Option Change Frequency" card |
| **→ Gauge custom notes adoption** | ⏳ Now | Monitor custom notes % |

---

## 🔗 Links

- PostHog Dashboard: https://app.posthog.com/dashboards
- Events Inspector: https://app.posthog.com/events
- API Docs: https://posthog.com/docs/api
- This Project Repo: Shopify store storefront

---

## 📝 Notes

- Events fire **client-side** when user interacts with PDP
- Each event includes source tag: `source: "gjm_product_pdp"`
- Funnel analysis is built into PostHog dashboards (automatic drop-off % calculation)
- Custom notes adoption is a proxy for high-intent customers
- Monitor option change frequency weekly to identify popular styles

---

**Last Updated:** March 26, 2026  
**Next Review:** After 1 week of live data (target: 50+ events)
