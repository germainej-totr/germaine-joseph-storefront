import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const PRODUCT_HANDLES = {
  suit: process.env.MTM_SUIT_HANDLE || 'vst-made-to-measure-two-piece-suit',
  trouser: process.env.MTM_TROUSER_HANDLE || 'vst-made-to-measure-dress-pants'
};

const TEST_MODE = process.env.VST_MODE || 'all'; // 'all', 'suit', 'trouser'

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function parseJsonSafely(label, value) {
  try {
    return JSON.parse(value || '[]');
  } catch {
    fail(`Invalid JSON in ${label}`);
  }
}

async function getProductByHandle(handle) {
  const query = `
    query ProductByHandle($query: String!) {
      products(first: 1, query: $query) {
        edges {
          node {
            id
            title
            handle
            status
            option_set: metafield(namespace: "gjm", key: "option_set") { value }
            measurement_guide: metafield(namespace: "gjm", key: "measurement_guide") { value }
            available_fabrics: metafield(namespace: "gjm", key: "available_fabrics") { value }
          }
        }
      }
    }
  `;

  const result = await shopifyAdminGraphQL(query, { query: `handle:${handle}` });
  if (result?.errors?.length > 0) {
    fail(`GraphQL error resolving product: ${JSON.stringify(result.errors)}`);
  }

  return result?.data?.products?.edges?.[0]?.node || null;
}

async function getOptionSet(optionSetId) {
  const query = `
    query OptionSetNode($id: ID!) {
      node(id: $id) {
        ... on Metaobject {
          id
          type
          handle
          fields {
            key
            value
            references(first: 50) {
              edges {
                node {
                  ... on Metaobject {
                    id
                    type
                    handle
                    displayName
                    fields {
                      key
                      value
                      reference {
                        ... on Metaobject {
                          id
                          type
                          handle
                          displayName
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const result = await shopifyAdminGraphQL(query, { id: optionSetId });
  if (result?.errors?.length > 0) {
    fail(`GraphQL error resolving option set: ${JSON.stringify(result.errors)}`);
  }

  return result?.data?.node || null;
}

async function getMeasurementGuide(guideId) {
  const query = `
    query GuideNode($id: ID!) {
      node(id: $id) {
        ... on Metaobject {
          id
          type
          handle
          displayName
          fields {
            key
            value
          }
        }
      }
    }
  `;

  const result = await shopifyAdminGraphQL(query, { id: guideId });
  if (result?.errors?.length > 0) {
    fail(`GraphQL error resolving measurement guide: ${JSON.stringify(result.errors)}`);
  }

  return result?.data?.node || null;
}

function fieldValue(metaobject, key) {
  return metaobject?.fields?.find(f => f.key === key)?.value || null;
}

async function validateProduct(productType, productHandle) {
  console.log(`\n🧪 Testing ${productType} product: '${productHandle}'`);

  const product = await getProductByHandle(productHandle);
  if (!product) {
    fail(`Product not found for handle '${productHandle}'`);
  }

  const optionSetId = product?.option_set?.value || null;
  const guideId = product?.measurement_guide?.value || null;

  if (!optionSetId) fail(`[${productType}] Missing gjm.option_set on product`);
  if (!guideId) fail(`[${productType}] Missing gjm.measurement_guide on product`);

  const optionSet = await getOptionSet(optionSetId);
  if (!optionSet) fail(`[${productType}] Referenced option set metaobject could not be loaded`);

  const optionsField = optionSet.fields?.find(f => f.key === 'options');
  const optionNodes = optionsField?.references?.edges?.map(e => e.node) || [];
  if (optionNodes.length === 0) {
    fail(`[${productType}] Option set has zero option references`);
  }

  const optionSummary = optionNodes.map(opt => {
    const choiceValue = opt?.fields?.find(f => f.key === 'choice')?.value || null;
    return {
      optionHandle: opt?.handle || null,
      choiceGid: choiceValue,
      required: opt?.fields?.find(f => f.key === 'required')?.value || null,
    };
  });

  const missingChoiceCount = optionSummary.filter(x => !x.choiceGid).length;
  if (missingChoiceCount > 0) {
    fail(`[${productType}] ${missingChoiceCount} option(s) missing linked gjm_choice references`);
  }

  const guide = await getMeasurementGuide(guideId);
  if (!guide) fail(`[${productType}] Referenced measurement guide metaobject could not be loaded`);

  const fieldsJson = fieldValue(guide, 'fields');
  const instructionalJson = fieldValue(guide, 'instructional_fields');
  const guideFields = parseJsonSafely(`[${productType}] measurement_guide.fields`, fieldsJson);
  const guideInstructions = parseJsonSafely(`[${productType}] measurement_guide.instructional_fields`, instructionalJson);

  if (!Array.isArray(guideFields) || guideFields.length === 0) {
    fail(`[${productType}] Measurement guide has no fields entries`);
  }
  if (!Array.isArray(guideInstructions) || guideInstructions.length === 0) {
    fail(`[${productType}] Measurement guide has no instructional_fields entries`);
  }

  console.log(`✓ ${productType} product validation passed`);

  return {
    product: {
      id: product.id,
      title: product.title,
      handle: product.handle,
      status: product.status,
      option_set: optionSetId,
      measurement_guide: guideId,
      available_fabrics: product?.available_fabrics?.value || null,
    },
    optionSet: {
      id: optionSet.id,
      handle: optionSet.handle,
      optionCount: optionNodes.length,
      sampleOptions: optionSummary.slice(0, 3),
    },
    measurementGuide: {
      id: guide.id,
      handle: guide.handle,
      fieldCount: guideFields.length,
      instructionalCount: guideInstructions.length,
    },
  };
}

async function run() {
  const results = {};
  const shouldTestSuit = TEST_MODE === 'all' || TEST_MODE === 'suit';
  const shouldTestTrouser = TEST_MODE === 'all' || TEST_MODE === 'trouser';

  console.log(`🚀 MTM Vertical Slice Test Suite (mode: ${TEST_MODE})`);

  if (shouldTestSuit) {
    try {
      results.suit = await validateProduct('suit', PRODUCT_HANDLES.suit);
    } catch (err) {
      fail(err?.message || String(err));
    }
  }

  if (shouldTestTrouser) {
    try {
      results.trouser = await validateProduct('trouser', PRODUCT_HANDLES.trouser);
    } catch (err) {
      fail(err?.message || String(err));
    }
  }

  console.log('\n✨ PASS: All MTM vertical slice tests passed');
  console.log(JSON.stringify(results, null, 2));
}

run().catch(err => {
  fail(err?.message || String(err));
});
