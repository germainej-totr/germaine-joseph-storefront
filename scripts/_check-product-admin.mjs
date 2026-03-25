import pkg from '@next/env';
const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

const { shopifyFetch } = await import('../lib/shopify.ts');

// 1. Try by GID via Storefront node interface
const nodeQuery = `{
  node(id: "gid://shopify/Product/8238795096100") {
    id
    ... on Product {
      title
      handle
      availableForSale
    }
  }
}`;

const r1 = await shopifyFetch({ query: nodeQuery, variables: {} });
console.log('Node query result:', JSON.stringify(r1?.data, null, 2));

// 2. Also try listing first few products to confirm API is working
const listQuery = `{ products(first: 5) { edges { node { id title handle } } } }`;
const r2 = await shopifyFetch({ query: listQuery, variables: {} });
console.log('\nFirst 5 products:');
for (const e of (r2?.data?.products?.edges || [])) {
  console.log(' ', e.node.handle, '-', e.node.title);
}

