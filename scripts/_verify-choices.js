import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const q = `{
  metaobjects(type: "gjm_choice", first: 60) {
    edges {
      node {
        id
        handle
        type
      }
    }
  }
}`;
const r = await shopifyAdminGraphQL(q, {});
const choices = r?.data?.metaobjects?.edges?.map(e => e.node) || [];
console.log(`Found ${choices.length} gjm_choice entries`);
choices.forEach(c => console.log(`  ${c.handle}`));
