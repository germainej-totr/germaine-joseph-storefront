const stagingBaseUrl = process.env.STAGING_BASE_URL;

if (!stagingBaseUrl) {
  console.error('Missing STAGING_BASE_URL. Example: https://staging.germainejoseph.com');
  process.exit(1);
}

const endpoint = `${stagingBaseUrl.replace(/\/$/, '')}/api/analytics/mtm-gate`;

const events = [
  'gjm_gate_full_mtm_required',
  'gjm_gate_saved_fit_eligible',
  'gjm_gate_refit_recommended',
  'gjm_gate_unauthenticated',
  'gjm_gate_profile_not_owned',
  'gjm_use_saved_fit_clicked',
  'gjm_start_new_fitting_clicked',
  'gjm_saved_fit_modal_shown',
  'gjm_refit_recommended_modal_shown',
];

function payloadFor(eventName) {
  return {
    event_name: eventName,
    occurred_at: new Date().toISOString(),
    product_handle: 'qa-mtm-product',
    product_type: 'suit',
    mtm_category: 'suit',
    variant_id: 'gid://shopify/ProductVariant/QA123',
    customer_id: 'gid://shopify/Customer/QA123',
    fit_profile_id: 'qa-fit-profile-123',
    gate_decision: eventName.includes('saved_fit') ? 'saved_fit_eligible' : 'full_mtm_required',
    gate_reason: eventName,
    profile_age_days: 120,
  };
}

async function main() {
  let passed = 0;

  for (const eventName of events) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFor(eventName)),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error(`FAILED ${eventName} -> ${response.status}: ${details}`);
      process.exitCode = 1;
      continue;
    }

    passed += 1;
    console.log(`OK ${eventName}`);
  }

  console.log(`\nSmoke complete. Passed ${passed}/${events.length} analytics ingress checks.`);

  if (passed !== events.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Smoke run failed:', error);
  process.exit(1);
});
