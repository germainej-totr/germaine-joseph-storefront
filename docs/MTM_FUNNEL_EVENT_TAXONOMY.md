# MTM Funnel Event Taxonomy (A22)

This taxonomy standardizes MTM funnel instrumentation from configurator start through order completion.

## Event Catalog

| Event Name | Stage | Trigger | Primary Properties |
| --- | --- | --- | --- |
| `gjm_mtm_configurator_start` | Top-of-funnel | Customer enters MTM configuration flow | `product_handle`, `mtm_category`, `entry_path`, `variant_id` |
| `gjm_mtm_option_change` | Engagement | Customer changes an MTM or configurable option | `option_name`, `option_value`, `mtm_category` |
| `gjm_mtm_fit_completion` | Fit readiness | Fit profile save succeeds | `fit_profile_id`, `product_handle`, `variant_id` |
| `gjm_mtm_booking_created` | Booking conversion | Booking API confirms or reserves booking | `booking_id`, `service_type`, `entry_path` |
| `gjm_mtm_deposit_paid` | Commerce intent | Shopify paid webhook received | `order_id`, `customer_id` |
| `gjm_mtm_cart_add` | Cart conversion | MTM item add endpoint succeeds | `mtm_category`, `fit_profile_id`, `variant_id` |
| `gjm_mtm_checkout_start` | Checkout initiation | Checkout URL generated after cart add | `mtm_category`, `fit_profile_id`, `variant_id` |
| `gjm_mtm_order_completed` | Completion | Order-created webhook persists production specs | `order_id`, `fit_profile_id`, `mtm_category` |

## Distinct ID Resolution

Priority order for PostHog distinct IDs:
1. `customer_id`
2. `fit_profile_id`
3. `booking_id`
4. `order_id`
5. `anon:<mtm_category|product_handle>` fallback

## Source Mapping

- Product page: configurator start and option change
- Fit smart flow: configurator start and fit completion
- Booking APIs: booking created
- Cart add APIs: cart add and checkout start
- Shopify webhooks:
  - order paid -> deposit paid
  - order created -> order completed

## Reporting Views

- Full funnel drop-off: start -> fit -> booking -> cart -> checkout -> order
- Saved-fit vs full-MTM split via `entry_path`
- Category comparison via `mtm_category` breakdown
- Booking-to-order and deposit-to-order conversion windows
