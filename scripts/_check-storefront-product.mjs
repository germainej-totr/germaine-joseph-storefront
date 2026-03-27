import 'dotenv/config';
import { shopifyFetch } from '../lib/shopify.ts';

const handle = process.env.CHECK_HANDLE || 'vst-oxford-shoe-non-tailor-config';

const query = `
  query($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      productType
    }
  }
`;

const result = await shopifyFetch({ query, variables: { handle } });
console.log(JSON.stringify(result, null, 2));
