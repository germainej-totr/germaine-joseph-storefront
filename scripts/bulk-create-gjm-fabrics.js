import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';

// Safety: defaults to dry-run so template data is not accidentally written.
const DRY_RUN = process.env.DRY_RUN_FABRICS !== 'false';

if (!SHOP || !ACCESS_TOKEN) {
  throw new Error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in environment');
}

/**
 * FABRIC DATA TEMPLATE
 *
 * Ask mills for this CSV/Excel shape (column headers):
 * handle,fabric_code,mill,bunch_name,composition,weight_gr_mt,season,weave,colour,price_tier,availability_status,active_status,swatch_image,hero_image,garment_render
 *
 * Notes:
 * - `handle`: lowercase + hyphen, unique across all gjm_fabric entries
 * - `price_tier`: standard | premium | luxury | bespoke
 * - `availability_status`: in_stock | low_stock | out_of_stock | pre_order
 * - `active_status`: true | false
 * - `swatch_image` / `hero_image` / `garment_render`: Shopify file GID preferred, URL allowed if your flow resolves later
 */
const fabrics = [
  {
    handle: 'vbc-navy-super150s-twill',
    fabric_code: 'VBC-150-NVY-001',
    mill: 'Vitale Barberis Canonico',
    bunch_name: 'Super 150s Collection',
    composition: '100% Wool',
    weight_gr_mt: 280,
    season: 'All Season',
    weave: 'Twill',
    colour: 'Navy Blue',
    price_tier: 'premium',
    availability_status: 'in_stock',
    active_status: true,
    swatch_image: null,
    hero_image: null,
    garment_render: null,
  },
  // Add more fabrics here.
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

function buildFields(fabric) {
  const fields = [
    { key: 'fabric_code', value: fabric.fabric_code || '' },
    { key: 'mill', value: fabric.mill || '' },
    { key: 'bunch_name', value: fabric.bunch_name || '' },
    { key: 'composition', value: fabric.composition || '' },
    { key: 'weight_gr_mt', value: String(fabric.weight_gr_mt ?? 0) },
    { key: 'season', value: fabric.season || '' },
    { key: 'weave', value: fabric.weave || '' },
    { key: 'colour', value: fabric.colour || '' },
    { key: 'price_tier', value: fabric.price_tier || 'standard' },
    { key: 'availability_status', value: fabric.availability_status || 'in_stock' },
    { key: 'active_status', value: fabric.active_status === false ? 'false' : 'true' },
  ];

  if (fabric.swatch_image) fields.push({ key: 'swatch_image', value: fabric.swatch_image });
  if (fabric.hero_image) fields.push({ key: 'hero_image', value: fabric.hero_image });
  if (fabric.garment_render) fields.push({ key: 'garment_render', value: fabric.garment_render });

  return fields;
}

async function upsertFabric(fabric) {
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
      type: 'gjm_fabric',
      handle: fabric.handle,
    },
    metaobject: {
      fields: buildFields(fabric),
    },
  };

  const result = await shopifyGraphQL(mutation, variables);
  const topErrors = result?.errors || [];
  const userErrors = result?.data?.metaobjectUpsert?.userErrors || [];

  if (topErrors.length || userErrors.length) {
    console.error(`ERROR ${fabric.handle}`);
    if (topErrors.length) console.error(JSON.stringify(topErrors));
    if (userErrors.length) console.error(JSON.stringify(userErrors));
    return false;
  }

  console.log(`OK ${fabric.handle} (${fabric.mill} - ${fabric.colour})`);
  return true;
}

async function bulkCreate() {
  if (!fabrics.length) {
    console.log('No fabrics in template. Add entries to the fabrics array.');
    return;
  }

  console.log(`Preparing ${fabrics.length} gjm_fabric entries. DRY_RUN=${DRY_RUN}`);

  if (DRY_RUN) {
    for (const fabric of fabrics) {
      console.log(`DRY_RUN ${fabric.handle} -> ${fabric.fabric_code} (${fabric.mill})`);
    }
    console.log('Dry run complete. Set DRY_RUN_FABRICS=false to write to Shopify.');
    return;
  }

  let okCount = 0;
  for (const fabric of fabrics) {
    const ok = await upsertFabric(fabric);
    if (ok) okCount += 1;
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`Completed. Upserted ${okCount}/${fabrics.length} entries.`);
}

bulkCreate().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
