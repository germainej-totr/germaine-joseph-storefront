import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const mutation = `
  mutation MetaobjectDefinitionUpdate($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition {
        id
        type
        fieldDefinitions {
          key
          type { name }
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const id = 'gid://shopify/MetaobjectDefinition/12811730980';

const deleteResult = await shopifyAdminGraphQL(mutation, {
  id,
  definition: {
    fieldDefinitions: [
      {
        delete: {
          key: 'options',
        },
      },
    ],
  },
});

console.log('Delete options result:');
console.log(JSON.stringify(deleteResult, null, 2));

const createResult = await shopifyAdminGraphQL(mutation, {
  id,
  definition: {
    fieldDefinitions: [
      {
        create: {
          key: 'options',
          name: 'Options',
          type: 'list.metaobject_reference',
          validations: [
            {
              name: 'metaobject_definition_id',
              value: 'gid://shopify/MetaobjectDefinition/12811698212',
            },
          ],
        },
      },
    ],
  },
});

console.log('Create options(list) result:');
console.log(JSON.stringify(createResult, null, 2));
