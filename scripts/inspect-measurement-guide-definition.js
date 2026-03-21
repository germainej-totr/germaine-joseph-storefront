import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const query = `
  query MeasurementGuideDefinition($type: String!) {
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

const result = await shopifyAdminGraphQL(query, { type: 'gjm_measurement_guide' });
console.log(JSON.stringify(result, null, 2));
