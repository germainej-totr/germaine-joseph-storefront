import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const DRY_RUN = process.env.DRY_RUN_ASSIGN !== 'false';

// ─── Seeded metaobject GIDs ────────────────────────────────────────────────
//
// OPTION_SETS — one per garment configuration (jacket closure, lapel, vent…)
const OPTION_SETS = {
  business_suit:      'gid://shopify/Metaobject/144727834660',
  wedding_suit:       'gid://shopify/Metaobject/144727867428',
  tuxedo:             'gid://shopify/Metaobject/144727965732',
  casual_blazer:      'gid://shopify/Metaobject/144727998500',
  double_breasted_suit: 'gid://shopify/Metaobject/144728031268',
  // Pending: shirt, trouser, overcoat, waistcoat option sets not seeded yet
};

// MEASUREMENT_GUIDES — hybrid model assignment logic:
//
//   bespoke_male_master_draft  →  ALL jacket-cut garments (suits, blazers,
//     overcoats, vests, trousers).  The guide carries 23 measurement fields
//     tagged with section:'jacket' or section:'trouser'.  App logic filters
//     by section at render time — no separate guide needed per garment.
//     Additionally serves as the FIT-LOGIC / SECRET SAUCE layer: ease bands,
//     block selection rules, and slim ↔ regular ↔ classic delta tables are
//     encoded in instructional_fields and evaluated server-side.
//
//   shirt_male / shirt_female  →  Shirt products only (10 dedicated fields).
//
const MEASUREMENT_GUIDES = {
  bespoke_male_master_draft: 'gid://shopify/Metaobject/144731832356',
  shirt_male:                'gid://shopify/Metaobject/144731865124',
  shirt_female:              'gid://shopify/Metaobject/144731897892',
};

// ─── Product assignments ───────────────────────────────────────────────────
//
// Each entry maps one Shopify product to its gjm.* metafields.
// Stubs for products not yet created in the store are commented out.
// Activate them as products are added — run only with DRY_RUN_ASSIGN=false.
//
// available_fabrics is intentionally null in all entries until fabric
// records are seeded (bulk-create-gjm-fabrics.js).
//
const productAssignments = [

  // ── Two-Piece Suit (LIVE) ──────────────────────────────────────────────
  {
    productId: 'gid://shopify/Product/8217068535844',
    productTitle: 'Made-to-Measure Two-Piece Suit',
    metafields: [
      { namespace: 'gjm', key: 'option_set',        type: 'metaobject_reference', value: OPTION_SETS.business_suit },
      { namespace: 'gjm', key: 'measurement_guide', type: 'metaobject_reference', value: MEASUREMENT_GUIDES.bespoke_male_master_draft },
    ],
  },

  // ── Stubs — add productId when product is created in Shopify ──────────

  // {
  //   productId: 'gid://shopify/Product/TODO',
  //   productTitle: 'Made-to-Measure Three-Piece Suit',
  //   metafields: [
  //     { namespace: 'gjm', key: 'option_set',        type: 'metaobject_reference', value: OPTION_SETS.business_suit },
  //     { namespace: 'gjm', key: 'measurement_guide', type: 'metaobject_reference', value: MEASUREMENT_GUIDES.bespoke_male_master_draft },
  //   ],
  // },

  // {
  //   productId: 'gid://shopify/Product/TODO',
  //   productTitle: 'Made-to-Measure Wedding Suit',
  //   metafields: [
  //     { namespace: 'gjm', key: 'option_set',        type: 'metaobject_reference', value: OPTION_SETS.wedding_suit },
  //     { namespace: 'gjm', key: 'measurement_guide', type: 'metaobject_reference', value: MEASUREMENT_GUIDES.bespoke_male_master_draft },
  //   ],
  // },

  // {
  //   productId: 'gid://shopify/Product/TODO',
  //   productTitle: 'Made-to-Measure Tuxedo',
  //   metafields: [
  //     { namespace: 'gjm', key: 'option_set',        type: 'metaobject_reference', value: OPTION_SETS.tuxedo },
  //     { namespace: 'gjm', key: 'measurement_guide', type: 'metaobject_reference', value: MEASUREMENT_GUIDES.bespoke_male_master_draft },
  //   ],
  // },

  // {
  //   productId: 'gid://shopify/Product/TODO',
  //   productTitle: 'Made-to-Measure Double-Breasted Suit',
  //   metafields: [
  //     { namespace: 'gjm', key: 'option_set',        type: 'metaobject_reference', value: OPTION_SETS.double_breasted_suit },
  //     { namespace: 'gjm', key: 'measurement_guide', type: 'metaobject_reference', value: MEASUREMENT_GUIDES.bespoke_male_master_draft },
  //   ],
  // },

  // {
  //   productId: 'gid://shopify/Product/TODO',
  //   productTitle: 'Made-to-Measure Casual Blazer',
  //   metafields: [
  //     // jacket-section fields only rendered by app logic (no trouser)
  //     { namespace: 'gjm', key: 'option_set',        type: 'metaobject_reference', value: OPTION_SETS.casual_blazer },
  //     { namespace: 'gjm', key: 'measurement_guide', type: 'metaobject_reference', value: MEASUREMENT_GUIDES.bespoke_male_master_draft },
  //   ],
  // },

  // {
  //   productId: 'gid://shopify/Product/TODO',
  //   productTitle: 'Made-to-Measure Overcoat',
  //   metafields: [
  //     // jacket-section fields only; length field applies to overcoat length
  //     { namespace: 'gjm', key: 'option_set',        type: 'metaobject_reference', value: OPTION_SETS.casual_blazer },
  //     { namespace: 'gjm', key: 'measurement_guide', type: 'metaobject_reference', value: MEASUREMENT_GUIDES.bespoke_male_master_draft },
  //   ],
  // },

  // {
  //   productId: 'gid://shopify/Product/TODO',
  //   productTitle: 'Made-to-Measure Waistcoat / Vest',
  //   metafields: [
  //     // jacket-section fields; sleeve + armhole fields skipped by app logic
  //     { namespace: 'gjm', key: 'option_set',        type: 'metaobject_reference', value: OPTION_SETS.business_suit },
  //     { namespace: 'gjm', key: 'measurement_guide', type: 'metaobject_reference', value: MEASUREMENT_GUIDES.bespoke_male_master_draft },
  //   ],
  // },

  // {
  //   productId: 'gid://shopify/Product/TODO',
  //   productTitle: 'Made-to-Measure Dress Shirt (Male)',
  //   metafields: [
  //     // TODO: seed a shirt option_set before activating
  //     { namespace: 'gjm', key: 'measurement_guide', type: 'metaobject_reference', value: MEASUREMENT_GUIDES.shirt_male },
  //   ],
  // },

  // {
  //   productId: 'gid://shopify/Product/TODO',
  //   productTitle: 'Made-to-Measure Dress Shirt (Female)',
  //   metafields: [
  //     { namespace: 'gjm', key: 'measurement_guide', type: 'metaobject_reference', value: MEASUREMENT_GUIDES.shirt_female },
  //   ],
  // },

];

async function assignMetafields(assignment) {
  const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const verifyQuery = `
    query ProductGjMMetafields($id: ID!) {
      product(id: $id) {
        id
        title
        option_set: metafield(namespace: "gjm", key: "option_set") { value }
        measurement_guide: metafield(namespace: "gjm", key: "measurement_guide") { value }
        available_fabrics: metafield(namespace: "gjm", key: "available_fabrics") { value }
      }
    }
  `;

  const variables = {
    input: {
      id: assignment.productId,
      metafields: assignment.metafields,
    },
  };

  if (DRY_RUN) {
    console.log(`DRY_RUN ${assignment.productTitle}`);
    for (const mf of assignment.metafields) {
      console.log(`  -> ${mf.namespace}.${mf.key} = ${mf.value}`);
    }
    return { dryRun: true };
  }

  const result = await shopifyAdminGraphQL(mutation, variables);
  const userErrors = result?.data?.productUpdate?.userErrors || [];

  if (userErrors.length > 0) {
    console.error(`ERROR updating ${assignment.productTitle}:`, JSON.stringify(userErrors));
    return false;
  }

  console.log(`OK updated ${assignment.productTitle}`);
  for (const mf of assignment.metafields) {
    console.log(`  -> ${mf.namespace}.${mf.key} assigned`);
  }

  const verify = await shopifyAdminGraphQL(verifyQuery, { id: assignment.productId });
  const p = verify?.data?.product;
  console.log('Verification snapshot:');
  console.log(JSON.stringify({
    id: p?.id,
    title: p?.title,
    option_set: p?.option_set?.value || null,
    measurement_guide: p?.measurement_guide?.value || null,
    available_fabrics: p?.available_fabrics?.value || null,
  }, null, 2));

  return true;
}

async function assignAll() {
  console.log(`Preparing to assign metafields to ${productAssignments.length} product(s). DRY_RUN=${DRY_RUN}`);

  let okCount = 0;
  for (const assignment of productAssignments) {
    const ok = await assignMetafields(assignment);
    if (ok) okCount += 1;
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  if (DRY_RUN) {
    console.log('\nTo actually assign metafields to products');
    console.log('Run:');
    console.log("$env:DRY_RUN_ASSIGN='false'; node scripts/assign-product-metafields.js");
  } else {
    console.log(`\nCompleted. Assigned metafields to ${okCount}/${productAssignments.length} product(s).`);
  }
}

assignAll().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
