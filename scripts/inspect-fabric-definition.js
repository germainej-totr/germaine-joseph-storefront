import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const query = `
  query FabricDefinition($type: String!) {
    metaobjectDefinitionByType(type: $type) {
      id
      type
      fieldDefinitions {
        key
        name
        required
        type { name }
      }
    }
  }
`;

const result = await shopifyAdminGraphQL(query, { type: 'gjm_fabric' });
console.log(JSON.stringify(result, null, 2));
