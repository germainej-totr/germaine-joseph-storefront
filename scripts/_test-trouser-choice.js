import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const mutation = `
  mutation metaobjectUpsert($input: MetaobjectUpsertInput!) {
    metaobjectUpsert(input: $input) {
      metaobject {
        id
        handle
        displayName
        type
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const variables = {
  input: {
    type: 'gjm_choice',
    handle: 'test_dress_pants',
    fields: [
      { key: 'label', value: 'Test Dress Pants' },
      { key: 'tags', value: JSON.stringify(['style']) }
    ]
  }
};

console.log('Sending mutation:');
const result = await shopifyAdminGraphQL(mutation, variables);
console.log(JSON.stringify(result, null, 2));
