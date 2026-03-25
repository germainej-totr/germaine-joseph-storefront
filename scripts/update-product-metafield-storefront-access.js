import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const definitions = [
  { namespace: 'gjm', key: 'measurement_guide', ownerType: 'PRODUCT' },
  { namespace: 'gjm', key: 'required_fit_gate', ownerType: 'PRODUCT' },
  { namespace: 'gjm', key: 'option_set', ownerType: 'PRODUCT' },
  { namespace: 'gjm', key: 'fabric_ref', ownerType: 'PRODUCT' },
  { namespace: 'gjm', key: 'lead_time_days', ownerType: 'PRODUCT' },
  { namespace: 'gjm', key: 'base_pattern_code', ownerType: 'PRODUCT' },
  { namespace: 'gjm', key: 'mtm_category', ownerType: 'PRODUCT' },
  { namespace: 'gjm', key: 'price_model', ownerType: 'PRODUCT' },
];

const mutation = `
  mutation UpdateMetafieldDefinition($definition: MetafieldDefinitionUpdateInput!) {
    metafieldDefinitionUpdate(definition: $definition) {
      updatedDefinition {
        id
        namespace
        key
        name
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

let okCount = 0;

for (const definition of definitions) {
  const result = await shopifyAdminGraphQL(mutation, {
    definition: {
      namespace: definition.namespace,
      key: definition.key,
      ownerType: definition.ownerType,
      access: {
        storefront: 'PUBLIC_READ',
      },
    },
  });

  const topErrors = result?.errors || [];
  const userErrors = result?.data?.metafieldDefinitionUpdate?.userErrors || [];

  if (topErrors.length || userErrors.length) {
    console.error(`ERROR ${definition.ownerType}:${definition.namespace}.${definition.key}`);
    if (topErrors.length) console.error(JSON.stringify(topErrors));
    if (userErrors.length) console.error(JSON.stringify(userErrors));
    continue;
  }

  const updated = result?.data?.metafieldDefinitionUpdate?.updatedDefinition;
  console.log(`OK ${updated.namespace}.${updated.key}`);
  okCount += 1;
}

console.log(`\nUpdated ${okCount}/${definitions.length} product metafield definitions for Storefront access.`);