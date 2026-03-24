import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';

if (!SHOP || !ACCESS_TOKEN) {
  throw new Error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in environment');
}

const options = [
  {
    handle: 'fit_silhouette',
    key: 'fit_silhouette',
    label: 'Fit',
    type: 'radio',
    ui_hint: 'buttons',
    required: true,
    sort_order: 10,
    section: 'silhouette',
    category: 'suit',
    choices: ['slim_fit', 'regular_fit', 'classic_fit'],
  },
  {
    handle: 'jacket_closure',
    key: 'jacket_closure',
    label: 'Jacket Closure',
    type: 'radio',
    ui_hint: 'buttons',
    required: true,
    sort_order: 20,
    section: 'jacket_details',
    category: 'suit',
    choices: ['one_button', 'two_button', 'three_button', 'four_button', 'five_button', 'three_roll_two', '4x1_double_breasted', '4x2_double_breasted', '6x1_double_breasted', '6x2_double_breasted'],
  },
  {
    handle: 'lapel_style',
    key: 'lapel_style',
    label: 'Lapel Style',
    type: 'radio',
    ui_hint: 'buttons',
    required: true,
    sort_order: 30,
    section: 'jacket_details',
    category: 'suit',
    choices: ['notch_lapel', 'peak_lapel', 'shawl_lapel'],
  },
  {
    handle: 'lapel_width',
    key: 'lapel_width',
    label: 'Lapel Width',
    type: 'radio',
    ui_hint: 'buttons',
    required: true,
    sort_order: 40,
    section: 'jacket_details',
    category: 'suit',
    choices: ['slim_lapel', 'standard_lapel', 'wide_lapel'],
  },
  {
    handle: 'pocket_style',
    key: 'pocket_style',
    label: 'Pocket Style',
    type: 'radio',
    ui_hint: 'buttons',
    required: true,
    sort_order: 50,
    section: 'jacket_details',
    category: 'suit',
    choices: ['flap_pocket', 'flap_ticket_pocket', 'jetted_pocket', 'patch_pocket'],
  },
  {
    handle: 'breast_pocket',
    key: 'breast_pocket',
    label: 'Breast Pocket',
    type: 'radio',
    ui_hint: 'buttons',
    required: true,
    sort_order: 60,
    section: 'jacket_details',
    category: 'suit',
    choices: ['barchetta_breast', 'straight_breast', 'patch_breast', 'no_breast_pocket'],
  },
  {
    handle: 'vent_style',
    key: 'vent_style',
    label: 'Back Vent',
    type: 'radio',
    ui_hint: 'buttons',
    required: true,
    sort_order: 70,
    section: 'jacket_details',
    category: 'suit',
    choices: ['double_vent', 'single_vent', 'no_vent'],
  },
  {
    handle: 'sleeve_buttons',
    key: 'sleeve_buttons',
    label: 'Sleeve Buttons',
    type: 'radio',
    ui_hint: 'buttons',
    required: true,
    sort_order: 80,
    section: 'jacket_details',
    category: 'suit',
    choices: ['three_sleeve_buttons', 'four_sleeve_buttons', 'five_sleeve_buttons'],
  },
  {
    handle: 'surgeon_cuffs',
    key: 'surgeon_cuffs',
    label: 'Working Cuffs',
    type: 'toggle',
    ui_hint: 'buttons',
    required: true,
    sort_order: 90,
    section: 'functional_details',
    category: 'suit',
    choices: ['standard_cuffs', 'working_cuffs'],
  },
  {
    handle: 'jacket_lining',
    key: 'jacket_lining',
    label: 'Lining',
    type: 'radio',
    ui_hint: 'buttons',
    required: true,
    sort_order: 100,
    section: 'jacket_details',
    category: 'suit',
    choices: ['full_lining', 'half_lining', 'unlined'],
  },
];

async function shopifyGraphQL(query, variables) {
  const response = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  return response.json();
}

async function getChoiceGid(handle) {
  const query = `
    query MetaobjectByHandle($handle: MetaobjectHandleInput!) {
      metaobjectByHandle(handle: $handle) {
        id
        handle
      }
    }
  `;

  const result = await shopifyGraphQL(query, {
    handle: {
      type: 'gjm_choice',
      handle,
    },
  });

  const topErrors = result?.errors || [];
  if (topErrors.length) {
    throw new Error(`GraphQL error for choice '${handle}': ${JSON.stringify(topErrors)}`);
  }

  const mo = result?.data?.metaobjectByHandle;
  if (!mo?.id) {
    throw new Error(`Missing gjm_choice handle '${handle}'. Create choices first.`);
  }

  return mo.id;
}

async function upsertOption(option) {
  const choiceIds = [];
  for (const choiceHandle of option.choices) {
    const gid = await getChoiceGid(choiceHandle);
    choiceIds.push(gid);
  }

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

  const validation = {
    required: option.required,
    sort_order: option.sort_order,
    section: option.section,
    category: option.category,
  };

  const variables = {
    handle: {
      type: 'gjm_option',
      handle: option.handle,
    },
    metaobject: {
      capabilities: {
        publishable: {
          status: 'ACTIVE'
        }
      },
      fields: [
        { key: 'key', value: option.key },
        { key: 'label', value: option.label },
        { key: 'type', value: option.type },
        { key: 'ui_hint', value: option.ui_hint },
        // Live definition uses `choice` (not `choices`) for list.metaobject_reference
        { key: 'choice', value: JSON.stringify(choiceIds) },
        { key: 'required', value: String(option.required) },
        { key: 'sort_order', value: String(option.sort_order) },
        { key: 'section', value: option.section },
        { key: 'category', value: option.category },
        // Preserve validation metadata in JSON when available downstream
        { key: 'validation', value: JSON.stringify(validation) },
      ],
    },
  };

  const result = await shopifyGraphQL(mutation, variables);

  const topErrors = result?.errors || [];
  const userErrors = result?.data?.metaobjectUpsert?.userErrors || [];

  if (topErrors.length || userErrors.length) {
    console.error(`ERROR ${option.handle}`);
    if (topErrors.length) console.error(JSON.stringify(topErrors));
    if (userErrors.length) console.error(JSON.stringify(userErrors));
    return false;
  }

  console.log(`OK ${option.handle} (${option.label}) with ${option.choices.length} choices`);
  return true;
}

async function bulkCreate() {
  console.log(`Starting upsert of ${options.length} gjm_option entries`);
  let okCount = 0;

  for (const option of options) {
    const ok = await upsertOption(option);
    if (ok) okCount += 1;
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`Completed. Upserted ${okCount}/${options.length} entries.`);
}

bulkCreate().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
