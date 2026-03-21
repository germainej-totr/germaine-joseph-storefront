import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const query = `
  query OptionSetDefinition($type: String!) {
    metaobjectDefinitionByType(type: $type) {
      id
      type
      fieldDefinitions {
        key
        name
        required
        type { name }
        validations {
          name
          value
        }
      }
    }
  }
`;

const result = await shopifyAdminGraphQL(query, { type: 'gjm_option_set' });
console.log(JSON.stringify(result, null, 2));
