import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';

if (!SHOP || !ACCESS_TOKEN) {
  throw new Error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in environment');
}

const choices = [
  // Fit Silhouette
  { handle: 'slim_fit', value: 'slim', label: 'Slim', price_delta: '0', tags: 'fit_silhouette' },
  { handle: 'regular_fit', value: 'regular', label: 'Regular', price_delta: '0', tags: 'fit_silhouette' },
  { handle: 'classic_fit', value: 'classic', label: 'Classic', price_delta: '0', tags: 'fit_silhouette' },

  // Jacket Closure
  { handle: 'one_button', value: 'one_button', label: '1 Button', price_delta: '0', tags: 'jacket_closure' },
  { handle: 'two_button', value: 'two_button', label: '2 Button', price_delta: '0', tags: 'jacket_closure' },
  { handle: 'three_button', value: 'three_button', label: '3 Button', price_delta: '0', tags: 'jacket_closure' },
  { handle: 'four_button', value: 'four_button', label: '4 Button', price_delta: '0', tags: 'jacket_closure' },
  { handle: 'five_button', value: 'five_button', label: '5 Button', price_delta: '0', tags: 'jacket_closure' },
  { handle: 'three_roll_two', value: 'three_roll_two', label: '3 Roll 2', price_delta: '40', tags: 'jacket_closure' },
  { handle: '4x1_double_breasted', value: '4x1_double_breasted', label: '4x1 Double Breasted', price_delta: '60', tags: 'jacket_closure' },
  { handle: '4x2_double_breasted', value: '4x2_double_breasted', label: '4x2 Double Breasted', price_delta: '60', tags: 'jacket_closure' },
  { handle: '6x1_double_breasted', value: '6x1_double_breasted', label: '6x1 Double Breasted', price_delta: '60', tags: 'jacket_closure' },
  { handle: '6x2_double_breasted', value: '6x2_double_breasted', label: '6x2 Double Breasted', price_delta: '60', tags: 'jacket_closure' },

  // Lapel Style
  { handle: 'notch_lapel', value: 'notch', label: 'Notch', price_delta: '0', tags: 'lapel_style' },
  { handle: 'peak_lapel', value: 'peak', label: 'Peak', price_delta: '40', tags: 'lapel_style' },
  { handle: 'shawl_lapel', value: 'shawl', label: 'Shawl', price_delta: '60', tags: 'lapel_style' },

  // Lapel Width
  { handle: 'slim_lapel', value: 'slim', label: 'Slim', price_delta: '0', tags: 'lapel_width' },
  { handle: 'standard_lapel', value: 'standard', label: 'Standard', price_delta: '0', tags: 'lapel_width' },
  { handle: 'wide_lapel', value: 'wide', label: 'Wide', price_delta: '0', tags: 'lapel_width' },

  // Pocket Style
  { handle: 'flap_pocket', value: 'flap', label: 'Flap', price_delta: '0', tags: 'pocket_style' },
  { handle: 'flap_ticket_pocket', value: 'flap_ticket', label: 'Flap + Ticket', price_delta: '20', tags: 'pocket_style' },
  { handle: 'jetted_pocket', value: 'jetted', label: 'Jetted', price_delta: '20', tags: 'pocket_style' },
  { handle: 'patch_pocket', value: 'patch', label: 'Patch', price_delta: '0', tags: 'pocket_style' },

  // Breast Pocket
  { handle: 'barchetta_breast', value: 'barchetta', label: 'Barchetta', price_delta: '0', tags: 'breast_pocket' },
  { handle: 'straight_breast', value: 'straight', label: 'Straight', price_delta: '0', tags: 'breast_pocket' },
  { handle: 'patch_breast', value: 'patch', label: 'Patch', price_delta: '0', tags: 'breast_pocket' },
  { handle: 'no_breast_pocket', value: 'none', label: 'None', price_delta: '0', tags: 'breast_pocket' },

  // Vent Style
  { handle: 'double_vent', value: 'double', label: 'Double Vent', price_delta: '0', tags: 'vent_style' },
  { handle: 'single_vent', value: 'single', label: 'Single Vent', price_delta: '0', tags: 'vent_style' },
  { handle: 'no_vent', value: 'none', label: 'No Vent', price_delta: '20', tags: 'vent_style' },

  // Sleeve Buttons
  { handle: 'three_sleeve_buttons', value: '3', label: '3 Buttons', price_delta: '0', tags: 'sleeve_buttons' },
  { handle: 'four_sleeve_buttons', value: '4', label: '4 Buttons', price_delta: '0', tags: 'sleeve_buttons' },
  { handle: 'five_sleeve_buttons', value: '5', label: '5 Buttons', price_delta: '10', tags: 'sleeve_buttons' },

  // Surgeon Cuffs
  { handle: 'standard_cuffs', value: 'false', label: 'Standard', price_delta: '0', tags: 'surgeon_cuffs' },
  { handle: 'working_cuffs', value: 'true', label: 'Working Cuffs', price_delta: '35', tags: 'surgeon_cuffs' },

  // Jacket Lining
  { handle: 'full_lining', value: 'full', label: 'Full Lining', price_delta: '0', tags: 'jacket_lining' },
  { handle: 'half_lining', value: 'half', label: 'Half Lining', price_delta: '0', tags: 'jacket_lining' },
  { handle: 'unlined', value: 'unlined', label: 'Unlined', price_delta: '20', tags: 'jacket_lining' },
];

async function upsertChoice(choice) {
  const mutation = `
    mutation MetaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject {
          id
          handle
          displayName
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const variables = {
    handle: {
      type: 'gjm_choice',
      handle: choice.handle,
    },
    metaobject: {
      fields: [
        { key: 'value', value: choice.value },
        { key: 'label', value: choice.label },
        { key: 'price_delta', value: choice.price_delta },
        // list.single_line_text_field expects a JSON array string
        { key: 'tags', value: JSON.stringify([choice.tags]) },
      ],
    },
  };

  const response = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  const result = await response.json();

  const topErrors = result?.errors || [];
  const userErrors = result?.data?.metaobjectUpsert?.userErrors || [];

  if (topErrors.length || userErrors.length) {
    console.error(`ERROR ${choice.handle}`);
    if (topErrors.length) console.error(JSON.stringify(topErrors));
    if (userErrors.length) console.error(JSON.stringify(userErrors));
    return false;
  }

  console.log(`OK ${choice.handle} (${choice.label})`);
  return true;
}

async function bulkCreate() {
  console.log(`Starting upsert of ${choices.length} gjm_choice entries`);
  let okCount = 0;

  for (const choice of choices) {
    const ok = await upsertChoice(choice);
    if (ok) okCount += 1;
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`Completed. Upserted ${okCount}/${choices.length} entries.`);
}

bulkCreate().catch((err) => {
  console.error(err);
  process.exit(1);
});
