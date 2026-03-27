import 'dotenv/config';
import { shopifyFetch } from '../lib/shopify.ts';

const query = `
  query {
    products(first: 10) {
      edges {
        node {
          id
          handle
          title
          productType
        }
      }
    }
  }
`;

const result = await shopifyFetch({ query, variables: {} });
console.log(JSON.stringify(result, null, 2));
