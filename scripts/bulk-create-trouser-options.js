import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const DRY_RUN = process.env.DRY_RUN_TROUSER_OPTIONS !== 'false';

const trouserOptions = [
  { handle: 'tr_style', key: 'style', label: 'Style', type: 'radio', ui_hint: 'cards', required: true, sort_order: 10, section: 'design', category: 'trouser', choiceTag: 'style' },
  { handle: 'tr_fit', key: 'fit', label: 'Fit', type: 'radio', ui_hint: 'buttons', required: true, sort_order: 20, section: 'design', category: 'trouser', choiceTag: 'fit' },
  { handle: 'tr_front_style', key: 'front_style', label: 'Front Style', type: 'radio', ui_hint: 'buttons', required: true, sort_order: 30, section: 'design', category: 'trouser', choiceTag: 'front_style' },
  { handle: 'tr_buttons', key: 'buttons', label: 'Buttons', type: 'select', ui_hint: 'dropdown', required: true, sort_order: 40, section: 'details', category: 'trouser', choiceTag: 'buttons' },
  { handle: 'tr_waistband', key: 'waistband', label: 'Waistband', type: 'radio', ui_hint: 'buttons', required: true, sort_order: 50, section: 'construction', category: 'trouser', choiceTag: 'waistband' },
  { handle: 'tr_fastening', key: 'fastening', label: 'Fastening', type: 'radio', ui_hint: 'buttons', required: true, sort_order: 60, section: 'construction', category: 'trouser', choiceTag: 'fastening' },
  { handle: 'tr_fly', key: 'fly', label: 'Fly', type: 'radio', ui_hint: 'buttons', required: true, sort_order: 70, section: 'construction', category: 'trouser', choiceTag: 'fly' },
  { handle: 'tr_front_pockets', key: 'front_pockets', label: 'Front Pockets', type: 'radio', ui_hint: 'buttons', required: true, sort_order: 80, section: 'pockets', category: 'trouser', choiceTag: 'front_pockets' },
  { handle: 'tr_back_pockets', key: 'back_pockets', label: 'Back Pockets', type: 'radio', ui_hint: 'buttons', required: true, sort_order: 90, section: 'pockets', category: 'trouser', choiceTag: 'back_pockets' },
  { handle: 'tr_lining', key: 'lining', label: 'Lining', type: 'radio', ui_hint: 'buttons', required: true, sort_order: 100, section: 'construction', category: 'trouser', choiceTag: 'lining' },
  { handle: 'tr_hem_style', key: 'hem_style', label: 'Hem Style', type: 'radio', ui_hint: 'buttons', required: true, sort_order: 110, section: 'finish', category: 'trouser', choiceTag: 'hem_style' },
  { handle: 'tr_tuxedo_contrast', key: 'tuxedo_contrast', label: 'Tuxedo Contrast', type: 'radio', ui_hint: 'buttons', required: true, sort_order: 120, section: 'formal_details', category: 'trouser', choiceTag: 'tuxedo_contrast' },
];

const choicesByTagQuery = `
  query ChoicesByTag($query: String!) {
    metaobjects(type: "gjm_choice", first: 100, query: $query) {
      edges {
        node {
          id
          handle
          fields {
            key
            value
          }
        }
      }
    }
  }
`;

const optionUpsertMutation = `
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

function fieldValue(node, key) {
  return node?.fields?.find(f => f.key === key)?.value || null;
}

async function getChoiceIdsForTag(tag) {
  const result = await shopifyAdminGraphQL(choicesByTagQuery, { query: `tags:${tag}` });
  const topErrors = result?.errors || [];
  if (topErrors.length) {
    throw new Error(`choices query error for tag '${tag}': ${JSON.stringify(topErrors)}`);
  }

  const nodes = result?.data?.metaobjects?.edges?.map(e => e.node) || [];
  const filtered = nodes.filter(n => {
    const tagsRaw = fieldValue(n, 'tags');
    try {
      const arr = JSON.parse(tagsRaw || '[]');
      return Array.isArray(arr) && arr.includes(tag);
    } catch {
      return false;
    }
  });

  if (filtered.length === 0) {
    throw new Error(`No choices found for tag '${tag}'. Seed choices first.`);
  }

  return filtered.map(n => n.id);
}

async function upsertOption(option) {
  const choiceIds = await getChoiceIdsForTag(option.choiceTag);
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
        { key: 'choice', value: JSON.stringify(choiceIds) },
        { key: 'required', value: String(option.required) },
        { key: 'sort_order', value: String(option.sort_order) },
        { key: 'section', value: option.section },
        { key: 'category', value: option.category },
        { key: 'validation', value: JSON.stringify(validation) },
      ],
    },
  };

  const result = await shopifyAdminGraphQL(optionUpsertMutation, variables);
  const topErrors = result?.errors || [];
  const userErrors = result?.data?.metaobjectUpsert?.userErrors || [];
  if (topErrors.length || userErrors.length) {
    throw new Error(JSON.stringify({ topErrors, userErrors }));
  }

  return result?.data?.metaobjectUpsert?.metaobject || null;
}

async function run() {
  console.log(`Preparing ${trouserOptions.length} trouser options. DRY_RUN=${DRY_RUN}`);

  let ok = 0;
  for (const option of trouserOptions) {
    if (DRY_RUN) {
      console.log(`DRY_RUN ${option.handle} <- tag:${option.choiceTag}`);
      continue;
    }

    try {
      const obj = await upsertOption(option);
      if (obj) {
        ok += 1;
        console.log(`OK ${option.handle}`);
      }
    } catch (err) {
      console.error(`ERROR ${option.handle}: ${err.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 180));
  }

  if (DRY_RUN) {
    console.log('\nRun live:');
    console.log("$env:DRY_RUN_TROUSER_OPTIONS='false'; node scripts/bulk-create-trouser-options.js");
  } else {
    console.log(`\nCompleted ${ok}/${trouserOptions.length} trouser options.`);
  }
}

run().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
