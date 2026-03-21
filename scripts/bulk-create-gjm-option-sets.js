import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';

if (!SHOP || !ACCESS_TOKEN) {
  throw new Error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in environment');
}

const optionSets = [
  {
    handle: 'business_suit',
    title: 'Business Suit',
    category: 'suit',
    version: '1.0',
    options: [
      'fit_silhouette',
      'jacket_closure',
      'lapel_style',
      'lapel_width',
      'pocket_style',
      'breast_pocket',
      'vent_style',
      'sleeve_buttons',
      'surgeon_cuffs',
      'jacket_lining',
    ],
    default_config: {
      fit_silhouette: 'regular_fit',
      jacket_closure: 'two_button',
      lapel_style: 'notch_lapel',
      lapel_width: 'standard_lapel',
      pocket_style: 'flap_pocket',
      breast_pocket: 'straight_breast',
      vent_style: 'double_vent',
      sleeve_buttons: 'four_sleeve_buttons',
      surgeon_cuffs: 'standard_cuffs',
      jacket_lining: 'full_lining',
    },
  },
  {
    handle: 'wedding_suit',
    title: 'Wedding Suit',
    category: 'suit',
    version: '1.0',
    options: [
      'fit_silhouette',
      'jacket_closure',
      'lapel_style',
      'lapel_width',
      'pocket_style',
      'breast_pocket',
      'vent_style',
      'sleeve_buttons',
      'surgeon_cuffs',
      'jacket_lining',
    ],
    default_config: {
      fit_silhouette: 'slim_fit',
      jacket_closure: 'two_button',
      lapel_style: 'peak_lapel',
      lapel_width: 'standard_lapel',
      pocket_style: 'jetted_pocket',
      breast_pocket: 'straight_breast',
      vent_style: 'double_vent',
      sleeve_buttons: 'four_sleeve_buttons',
      surgeon_cuffs: 'working_cuffs',
      jacket_lining: 'full_lining',
    },
  },
  {
    handle: 'tuxedo',
    title: 'Tuxedo',
    category: 'formal',
    version: '1.0',
    options: [
      'fit_silhouette',
      'jacket_closure',
      'lapel_style',
      'lapel_width',
      'pocket_style',
      'breast_pocket',
      'vent_style',
      'sleeve_buttons',
      'surgeon_cuffs',
      'jacket_lining',
    ],
    default_config: {
      fit_silhouette: 'slim_fit',
      jacket_closure: 'one_button',
      lapel_style: 'shawl_lapel',
      lapel_width: 'standard_lapel',
      pocket_style: 'jetted_pocket',
      breast_pocket: 'straight_breast',
      vent_style: 'no_vent',
      sleeve_buttons: 'four_sleeve_buttons',
      surgeon_cuffs: 'working_cuffs',
      jacket_lining: 'full_lining',
    },
  },
  {
    handle: 'casual_blazer',
    title: 'Casual Blazer',
    category: 'blazer',
    version: '1.0',
    options: [
      'fit_silhouette',
      'jacket_closure',
      'lapel_style',
      'lapel_width',
      'pocket_style',
      'breast_pocket',
      'vent_style',
      'sleeve_buttons',
      'jacket_lining',
    ],
    default_config: {
      fit_silhouette: 'regular_fit',
      jacket_closure: 'two_button',
      lapel_style: 'notch_lapel',
      lapel_width: 'standard_lapel',
      pocket_style: 'patch_pocket',
      breast_pocket: 'patch_breast',
      vent_style: 'double_vent',
      sleeve_buttons: 'three_sleeve_buttons',
      jacket_lining: 'half_lining',
    },
  },
  {
    handle: 'double_breasted_suit',
    title: 'Double Breasted Suit',
    category: 'suit',
    version: '1.0',
    options: [
      'fit_silhouette',
      'jacket_closure',
      'lapel_style',
      'lapel_width',
      'pocket_style',
      'breast_pocket',
      'vent_style',
      'sleeve_buttons',
      'surgeon_cuffs',
      'jacket_lining',
    ],
    default_config: {
      fit_silhouette: 'classic_fit',
      jacket_closure: '6x2_double_breasted',
      lapel_style: 'peak_lapel',
      lapel_width: 'wide_lapel',
      pocket_style: 'flap_pocket',
      breast_pocket: 'straight_breast',
      vent_style: 'double_vent',
      sleeve_buttons: 'four_sleeve_buttons',
      surgeon_cuffs: 'standard_cuffs',
      jacket_lining: 'full_lining',
    },
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

async function getOptionGid(handle) {
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
      type: 'gjm_option',
      handle,
    },
  });

  const topErrors = result?.errors || [];
  if (topErrors.length) {
    throw new Error(`GraphQL error for option '${handle}': ${JSON.stringify(topErrors)}`);
  }

  const mo = result?.data?.metaobjectByHandle;
  if (!mo?.id) {
    throw new Error(`Missing gjm_option handle '${handle}'. Create options first.`);
  }

  return mo.id;
}

async function upsertOptionSet(optionSet) {
  const optionIds = [];
  for (const optionHandle of optionSet.options) {
    const gid = await getOptionGid(optionHandle);
    optionIds.push(gid);
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

  const variables = {
    handle: {
      type: 'gjm_option_set',
      handle: optionSet.handle,
    },
    metaobject: {
      fields: [
        { key: 'title', value: optionSet.title },
        { key: 'category', value: optionSet.category },
        { key: 'version', value: optionSet.version },
        // list.metaobject_reference expects JSON array of GIDs
        { key: 'options', value: JSON.stringify(optionIds) },
        { key: 'default_config', value: JSON.stringify(optionSet.default_config) },
      ],
    },
  };

  const result = await shopifyGraphQL(mutation, variables);

  const topErrors = result?.errors || [];
  const userErrors = result?.data?.metaobjectUpsert?.userErrors || [];

  if (topErrors.length || userErrors.length) {
    console.error(`ERROR ${optionSet.handle}`);
    if (topErrors.length) console.error(JSON.stringify(topErrors));
    if (userErrors.length) console.error(JSON.stringify(userErrors));
    return false;
  }

  console.log(`OK ${optionSet.handle} (${optionSet.title}) with ${optionSet.options.length} options`);
  return true;
}

async function bulkCreate() {
  console.log(`Starting upsert of ${optionSets.length} gjm_option_set entries`);
  let okCount = 0;

  for (const optionSet of optionSets) {
    const ok = await upsertOptionSet(optionSet);
    if (ok) okCount += 1;
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`Completed. Upserted ${okCount}/${optionSets.length} entries.`);
}

bulkCreate().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
