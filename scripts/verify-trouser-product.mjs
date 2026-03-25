import pkg from '@next/env';
const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

const { shopifyFetch } = await import('../lib/shopify.ts');

const query = `{
  product(handle: "mtm-trouser-test-build") {
    id
    title
    handle
    metafields(identifiers: [
      { namespace: "gjm", key: "required_fit_gate" },
      { namespace: "gjm", key: "mtm_category" },
      { namespace: "gjm", key: "option_set" },
      { namespace: "gjm", key: "measurement_guide" }
    ]) {
      key
      value
      reference {
        ... on Metaobject {
          id
          handle
          type
        }
      }
    }
  }
}`;

const r = await shopifyFetch({ query, variables: {} });
const product = r?.data?.product;

if (!product) {
  console.error('Product not found. Has it been saved in Shopify Admin?');
  process.exit(1);
}

console.log('\nProduct resolved:');
console.log(`  id:     ${product.id}`);
console.log(`  title:  ${product.title}`);
console.log(`  handle: ${product.handle}`);

const REQUIRED_KEYS = ['required_fit_gate', 'mtm_category', 'option_set', 'measurement_guide'];
const mfMap = Object.fromEntries(
  REQUIRED_KEYS.map(k => {
    const found = product.metafields.find(m => m?.key === k);
    return [k, found ?? null];
  })
);

console.log('\nMetafields:');
for (const key of REQUIRED_KEYS) {
  const metafield = mfMap[key];
  const value = metafield?.value ?? null;
  const reference = metafield?.reference ?? null;
  const displayValue = reference ? `${reference.handle} (${reference.id})` : (value ?? '(null)');
  const pass = (() => {
    if (!metafield)                  return 'FAIL (missing metafield)';
    if (key === 'required_fit_gate') return value === 'true' ? 'PASS' : `FAIL (expected true, got ${value})`;
    if (key === 'mtm_category')      return value === 'trouser' ? 'PASS' : `FAIL (expected trouser, got ${value})`;
    return reference?.id ? 'PASS' : 'FAIL (reference not resolvable)';
  })();
  console.log(`  ${key}: ${displayValue}  →  ${pass}`);
}

const allGood =
  mfMap['required_fit_gate']?.value === 'true' &&
  mfMap['mtm_category']?.value === 'trouser' &&
  !!mfMap['option_set']?.reference?.id &&
  !!mfMap['measurement_guide']?.reference?.id;

console.log(allGood
  ? '\nProduct is correctly configured for QA. Proceed with staging run.'
  : '\nOne or more metafields need attention — fix before QA run.');

process.exit(allGood ? 0 : 1);
