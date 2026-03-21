import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const query = `
  query InspectFieldDefinitionInputs {
    update: __type(name: "MetaobjectFieldDefinitionUpdateInput") {
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
    create: __type(name: "MetaobjectFieldDefinitionCreateInput") {
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
    delete: __type(name: "MetaobjectFieldDefinitionDeleteInput") {
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
