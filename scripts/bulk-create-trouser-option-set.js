import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const DRY_RUN = process.env.DRY_RUN_TROUSER_OPTION_SET !== 'false';

const TROUSER_OPTION_SET = {
  handle: 'trouser-core-v1',
  title: 'Trouser Core v1',
  category: 'trouser',
  version: 'v1',
  optionHandles: [
    'tr_style',
    'tr_fit',
    'tr_front_style',
    'tr_buttons',
    'tr_waistband',
    'tr_fastening',
    'tr_fly',
    'tr_front_pockets',
    'tr_back_pockets',
    'tr_lining',
    'tr_hem_style',
    'tr_tuxedo_contrast',
  ],
};

const findOptionQuery = `
  query FindOption($query: String!) {
    metaobjects(type: "gjm_option", first: 1, query: $query) {
      edges {
        node {
          id
          handle
        }
      }
    }
  }
`;

const optionSetUpsertMutation = `
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

async function resolveOptionIds(handles) {
  const ids = [];
  for (const handle of handles) {
    const result = await shopifyAdminGraphQL(findOptionQuery, { query: `handle:${handle}` });
    const topErrors = result?.errors || [];
    if (topErrors.length) {
      throw new Error(`Query error for option '${handle}': ${JSON.stringify(topErrors)}`);
    }

    const node = result?.data?.metaobjects?.edges?.[0]?.node;
    if (!node?.id) {
      throw new Error(`Option not found: ${handle}`);
    }
    ids.push(node.id);
  }
  return ids;
}

async function upsertOptionSet() {
  const optionIds = await resolveOptionIds(TROUSER_OPTION_SET.optionHandles);

  const variables = {
    handle: {
      type: 'gjm_option_set',
      handle: TROUSER_OPTION_SET.handle,
    },
    metaobject: {
      capabilities: {
        publishable: {
          status: 'ACTIVE'
        }
      },
      fields: [
        { key: 'title', value: TROUSER_OPTION_SET.title },
        { key: 'category', value: TROUSER_OPTION_SET.category },
        { key: 'version', value: TROUSER_OPTION_SET.version },
        { key: 'options', value: JSON.stringify(optionIds) },
        { key: 'default_config', value: JSON.stringify({ style: 'dress_pants', fit: 'regular_tailored', hem_style: 'plain_hem' }) },
      ],
    },
  };

  const result = await shopifyAdminGraphQL(optionSetUpsertMutation, variables);
  const topErrors = result?.errors || [];
  const userErrors = result?.data?.metaobjectUpsert?.userErrors || [];

  if (topErrors.length || userErrors.length) {
    throw new Error(JSON.stringify({ topErrors, userErrors }));
  }

  return result?.data?.metaobjectUpsert?.metaobject || null;
}

async function run() {
  console.log(`Preparing trouser option set. DRY_RUN=${DRY_RUN}`);

  if (DRY_RUN) {
    console.log(`DRY_RUN ${TROUSER_OPTION_SET.handle}`);
    console.log(`options: ${TROUSER_OPTION_SET.optionHandles.join(', ')}`);
    console.log('\nRun live:');
    console.log("$env:DRY_RUN_TROUSER_OPTION_SET='false'; node scripts/bulk-create-trouser-option-set.js");
    return;
  }

  const obj = await upsertOptionSet();
  if (!obj?.id) {
    throw new Error('No option set returned by Shopify.');
  }

  console.log(`OK ${obj.handle}`);
  console.log(`Option set GID: ${obj.id}`);
  console.log(`\nUse in product script:`);
  console.log(`$env:MTM_TROUSER_OPTION_SET_GID='${obj.id}'`);
}

run().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
