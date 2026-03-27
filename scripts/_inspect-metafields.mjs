import 'dotenv/config';
import { shopifyAdminGraphQL } from '../lib/shopify.ts';

const QUERY = `
  query($ownerType: MetafieldOwnerType!, $namespace: String!, $key: String!) {
    metafieldDefinitions(first: 5, ownerType: $ownerType, namespace: $namespace, key: $key) {
      edges {
        node {
          id
          name
          namespace
          key
          type { name }
          validations { name value }
        }
      }
    }
  }
`;

for (const key of ['mtm_category', 'required_fit_gate']) {
  const result = await shopifyAdminGraphQL(QUERY, {
    ownerType: 'PRODUCT',
    namespace: 'gjm',
    key,
  });

  console.log('\nKEY:', key);
  console.log(JSON.stringify(result?.data?.metafieldDefinitions?.edges?.map((e) => e.node) || [], null, 2));
}
