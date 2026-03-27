import assert from 'node:assert/strict';
import { resolveHomeProductCardFlow } from '../lib/home-product-card-flow.ts';

const mtmFlow = resolveHomeProductCardFlow({
  id: 'gid://shopify/Product/1',
  handle: 'mtm-jacket',
  title: 'MTM Jacket',
  mtmRequired: true,
});

assert.equal(mtmFlow.isMTM, true, 'MTM product should be treated as MTM');
assert.equal(mtmFlow.action, 'open_fit_gate', 'MTM product should open fit gate');
assert.equal(mtmFlow.ctaLabel, 'Create Fit Profile', 'MTM CTA should request fit profile creation');
assert.equal(mtmFlow.href, undefined, 'MTM product should not route directly to product page');

const nonMtmFlow = resolveHomeProductCardFlow({
  id: 'gid://shopify/Product/2',
  handle: 'vst-oxford-shoe-non-tailor-config',
  title: 'VST - Oxford Shoe (Non-Tailor Config)',
  mtmRequired: false,
});

assert.equal(nonMtmFlow.isMTM, false, 'non-MTM product should not be treated as MTM');
assert.equal(nonMtmFlow.action, 'open_product', 'non-MTM product should route to product page');
assert.equal(nonMtmFlow.ctaLabel, 'View Product', 'non-MTM CTA should not show fit-gate copy');
assert.equal(
  nonMtmFlow.href,
  '/p/vst-oxford-shoe-non-tailor-config',
  'non-MTM href should point to product details route'
);

console.log('resolveHomeProductCardFlow: regression checks passed');