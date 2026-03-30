# A24 Alert Rules Template

Use this as the source-of-truth when creating alerts in your monitoring platform.

## Rule 1: API 5xx Error Spike

- Name: `gj_api_5xx_spike`
- Condition: 5xx rate above baseline for 10 minutes
- Severity: high
- Notify: primary on-call, secondary on-call

## Rule 2: Production Deployment Failure

- Name: `gj_deploy_failure_prod`
- Condition: latest production deployment status is failed
- Severity: high
- Notify: release owner, engineering channel

## Rule 3: Lifecycle Cron Missing Success

- Name: `gj_lifecycle_cron_missing`
- Condition: no successful run for `/api/automation/lifecycle-reminder-cron` in 24h
- Severity: high
- Notify: operations owner

## Rule 4: MTM Checkout-to-Order Funnel Drop

- Name: `gj_mtm_checkout_to_order_drop`
- Condition: conversion from `gjm_mtm_checkout_start` to `gjm_mtm_order_completed` below baseline
- Window: rolling 24h
- Severity: medium
- Notify: product analytics + operations

## Rule 5: Booking Mutation Failures

- Name: `gj_booking_mutation_failures`
- Condition: `/api/bookings/reschedule` or `/api/bookings/[id]` non-2xx rate above baseline
- Severity: high
- Notify: operations owner

## Verification

After creating alerts, validate by:

1. Triggering a synthetic check where possible.
2. Confirming notification delivery channel receives alert.
3. Recording alert IDs/links in launch notes.