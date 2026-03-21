import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const query = `
  query InspectInput {
    operation: __type(name: "MetaobjectFieldDefinitionOperationInput") {
      name
      inputFields {
        name
        type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
      }
    }
    updateInput: __type(name: "MetaobjectDefinitionUpdateInput") {
      name
      inputFields {
        name
        type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
      }
    }
  }
`;

const result = await shopifyAdminGraphQL(query, {});
console.log(JSON.stringify(result, null, 2));
