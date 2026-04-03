const stagingBaseUrl = process.env.STAGING_BASE_URL;
const bypassToken = process.env.VERCEL_BYPASS_TOKEN;
const isDryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

const endpoint = stagingBaseUrl
  ? `${stagingBaseUrl.replace(/\/$/, '')}/api/analytics/mtm-funnel`
  : null;

const CATEGORY_REQUIRED_FIELDS = {
  suit: [
    'category',
    'category_option_set',
    'category_option_set_version',
    'category_design_upcharge',
    'suit_lapel_type',
    'suit_buttoning',
    'suit_fit',
    'suit_variant',
  ],
  blazer: [
    'category',
    'category_option_set',
    'category_option_set_version',
    'category_design_upcharge',
    'blazer_fit',
    'blazer_lapel_type',
    'blazer_buttoning',
    'blazer_pocket_style',
  ],
  shirt: [
    'category',
    'category_option_set',
    'category_option_set_version',
    'category_design_upcharge',
    'shirt_fit',
    'shirt_collar',
    'shirt_cuff',
    'shirt_placket',
  ],
  overcoat: [
    'category',
    'category_option_set',
    'category_option_set_version',
    'category_design_upcharge',
    'overcoat_silhouette',
    'overcoat_length',
    'overcoat_closure',
    'overcoat_lapel',
  ],
  vest: [
    'category',
    'category_option_set',
    'category_option_set_version',
    'category_design_upcharge',
    'waistcoat_fit',
    'waistcoat_front_style',
    'waistcoat_neckline',
    'waistcoat_buttons',
  ],
};

function samplePropertiesForCategory(category) {
  if (category === 'suit') {
    return {
      category: 'suit',
      category_option_set: 'suit-tuxedo-v1',
      category_option_set_version: 'v1',
      category_design_upcharge: '2600',
      category_fabric_id: 'fabric_suit_001',
      suit_lapel_type: 'peak_lapel',
      suit_buttoning: 'one_button',
      suit_fit: 'regular_fit',
      suit_variant: 'tuxedo',
    };
  }

  if (category === 'blazer') {
    return {
      category: 'blazer',
      category_option_set: 'blazer-core-v1',
      category_option_set_version: 'v1',
      category_design_upcharge: '1400',
      category_fabric_id: 'fabric_blazer_001',
      blazer_fit: 'tailored',
      blazer_lapel_type: 'peak',
      blazer_buttoning: 'single_two',
      blazer_pocket_style: 'flap',
    };
  }

  if (category === 'shirt') {
    return {
      category: 'shirt',
      category_option_set: 'shirt-core-v1',
      category_option_set_version: 'v1',
      category_design_upcharge: '900',
      category_fabric_id: 'fabric_shirt_001',
      shirt_fit: 'tailored',
      shirt_collar: 'cutaway',
      shirt_cuff: 'double_french',
      shirt_placket: 'hidden',
    };
  }

  if (category === 'overcoat') {
    return {
      category: 'overcoat',
      category_option_set: 'overcoat-core-v1',
      category_option_set_version: 'v1',
      category_design_upcharge: '2200',
      category_fabric_id: 'fabric_overcoat_001',
      overcoat_silhouette: 'tailored',
      overcoat_length: 'long',
      overcoat_closure: 'double_breasted',
      overcoat_lapel: 'peak',
    };
  }

  return {
    category: 'vest',
    category_option_set: 'waistcoat-core-v1',
    category_option_set_version: 'v1',
    category_design_upcharge: '1000',
    category_fabric_id: 'fabric_waistcoat_001',
    waistcoat_fit: 'tailored',
    waistcoat_front_style: 'single_breasted',
    waistcoat_neckline: 'v_neck',
    waistcoat_buttons: 'five',
  };
}

function createEvent(eventName, category) {
  return {
    event_name: eventName,
    occurred_at: new Date().toISOString(),
    product_handle: `qa-${category}-product`,
    product_type: 'mtm',
    mtm_category: category,
    variant_id: 'gid://shopify/ProductVariant/QA123',
    customer_id: 'gid://shopify/Customer/QA123',
    fit_profile_id: `qa-fit-profile-${category}`,
    entry_path: 'full_mtm',
    funnel_step: eventName === 'gjm_mtm_cart_add' ? 'cart_add' : 'checkout_start',
    source: 'phase_3_2_category_smoke',
    properties: samplePropertiesForCategory(category),
  };
}

function validateRequiredFields(payload) {
  const category = payload.mtm_category;
  const required = CATEGORY_REQUIRED_FIELDS[category];
  if (!required) {
    throw new Error(`No required-field map for category: ${category}`);
  }

  const properties = payload.properties || {};
  const missing = required.filter((field) => {
    const value = properties[field];
    return typeof value !== 'string' || value.length === 0;
  });

  if (missing.length) {
    throw new Error(`${category} payload missing required analytics fields: ${missing.join(', ')}`);
  }
}

async function postEvent(payload) {
  if (!endpoint) {
    throw new Error('Missing STAGING_BASE_URL. Example: https://staging.germainejoseph.com');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (bypassToken) {
    headers['x-vercel-protection-bypass'] = bypassToken;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`${payload.event_name}/${payload.mtm_category} -> ${response.status}: ${details}`);
  }
}

async function main() {
  const categories = ['suit', 'blazer', 'shirt', 'overcoat', 'vest'];
  const events = ['gjm_mtm_cart_add', 'gjm_mtm_checkout_start'];

  let validated = 0;
  let posted = 0;

  for (const category of categories) {
    for (const eventName of events) {
      const payload = createEvent(eventName, category);
      validateRequiredFields(payload);
      validated += 1;

      if (!isDryRun) {
        await postEvent(payload);
        posted += 1;
      }

      console.log(`OK ${eventName}/${category} (${isDryRun ? 'validated' : 'posted'})`);
    }
  }

  console.log(`\nCategory analytics smoke complete. Validated ${validated} payloads.`);
  if (isDryRun) {
    console.log('Dry-run mode enabled; no events posted.');
  } else {
    console.log(`Posted ${posted} payloads to ${endpoint}.`);
  }
}

if (!stagingBaseUrl && !isDryRun) {
  console.error('Missing STAGING_BASE_URL. Use --dry-run to validate payloads without posting.');
  process.exit(1);
}

main().catch((error) => {
  console.error('Category MTM funnel smoke failed:', error.message || error);
  process.exit(1);
});
