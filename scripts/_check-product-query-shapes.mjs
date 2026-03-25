import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

async function queryStorefront(query, variables) {
  const res = await fetch(`https://${domain}/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

const byHandle = await queryStorefront(
  'query($h:String!){ productByHandle(handle:$h){ id handle title } }',
  { h: 'mtm-trouser-test-build' }
);

const productField = await queryStorefront(
  'query($h:String!){ product(handle:$h){ id handle title } }',
  { h: 'mtm-trouser-test-build' }
);

console.log('productByHandle:', JSON.stringify(byHandle, null, 2));
console.log('product(handle):', JSON.stringify(productField, null, 2));
