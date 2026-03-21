import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const DRY_RUN = process.env.DRY_RUN_METAFIELDS !== 'false';

/**
 * Product Metafield Definitions for MTM Architecture
 *
 * These metafields link products to the MTM configurator data:
 * 1. gjm.option_set -> Links to gjm_option_set (which options to show)
 * 2. gjm.available_fabrics -> Links to gjm_fabric entries (which fabrics to offer)
 * 3. gjm.measurement_guide -> Links to gjm_measurement_guide (which measurements to collect)
 */
const metafieldDefinitions = [
  {
    name: 'Option Set',
    namespace: 'gjm',
    key: 'option_set',
    description: 'Links to the gjm_option_set that defines which configurator options to display for this product',
    type: 'metaobject_reference',
    validations: [
      {
        name: 'metaobject_definition_id',
        value: 'gid://shopify/MetaobjectDefinition/12811730980', // gjm_option_set
      },
    ],
  },
  {
    name: 'Available Fabrics',
    namespace: 'gjm',
    key: 'available_fabrics',
    description: 'Links to gjm_fabric entries that are available for this product',
    type: 'list.metaobject_reference',
    validations: [
      {
        name: 'metaobject_definition_id',
        value: 'gid://shopify/MetaobjectDefinition/12811567140', // gjm_fabric
      },
    ],
  },
  {
    name: 'Measurement Guide',
    namespace: 'gjm',
    key: 'measurement_guide',
    description: 'Links to the gjm_measurement_guide for collecting customer measurements',
    type: 'metaobject_reference',
    validations: [
      {
        name: 'metaobject_definition_id',
        value: 'gid://shopify/MetaobjectDefinition/12811108388', // gjm_measurement_guide
      },
    ],
  },
];

async function createMetafieldDefinition(definition) {
  const mutation = `
    mutation createMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          name
          namespace
          key
          type {
            name
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    definition: {
      name: definition.name,
      namespace: definition.namespace,
      key: definition.key,
      description: definition.description,
      type: definition.type,
      ownerType: 'PRODUCT',
      validations: definition.validations,
    },
  };

  if (DRY_RUN) {
    console.log(`DRY_RUN ${definition.namespace}.${definition.key} -> ${definition.type}`);
    return { dryRun: true };
  }

  const result = await shopifyAdminGraphQL(mutation, variables);
  const userErrors = result?.data?.metafieldDefinitionCreate?.userErrors || [];

  if (userErrors.length > 0) {
    console.error(`ERROR ${definition.namespace}.${definition.key}:`, JSON.stringify(userErrors));
  } else {
    console.log(`OK ${definition.namespace}.${definition.key} (${definition.type})`);
  }

  return result;
}

async function createDefinitions() {
  console.log(`Preparing ${metafieldDefinitions.length} product metafield definitions. DRY_RUN=${DRY_RUN}`);

  for (const definition of metafieldDefinitions) {
    await createMetafieldDefinition(definition);
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  if (DRY_RUN) {
    console.log('\nTo actually create metafield definitions in Shopify');
    console.log('Run:');
    console.log("$env:DRY_RUN_METAFIELDS='false'; node scripts/create-product-metafield-definitions.js");
  } else {
    console.log(`\nCompleted processing ${metafieldDefinitions.length} product metafield definitions.`);
  }
}

createDefinitions().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
