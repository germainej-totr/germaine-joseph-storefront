/**
 * Regression test: Product API response contracts
 * 
 * Ensures that /api/products and /api/products/[handle] endpoints
 * maintain their typed response contracts (ProductListResponse, ProductDetailResponse).
 * 
 * Run via: npm run test:product-api-contracts
 */

import { strict as assert } from 'assert';

interface ProductListResponse {
  products: Array<{ handle: string; title?: string }>;
  collection: { handle?: string; title?: string } | null;
  error?: string;
}

interface ProductDetailResponse {
  product: { handle: string; title?: string } | null;
  error?: string;
}

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function requestJson(path: string): Promise<unknown> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url);
  return response.json();
}

async function testProductListResponseContract(): Promise<void> {
  console.log('[ProductListResponse] Testing /api/products contract...');
  
  const payload = await requestJson('/api/products?first=10');
  
  // Verify structure matches ProductListResponse
  assert(payload !== null && typeof payload === 'object', 'Response should be an object');
  assert(Array.isArray((payload as Record<string, unknown>).products), 'Should have products array');
  assert(
    (payload as Record<string, unknown>).collection === null || typeof (payload as Record<string, unknown>).collection === 'object',
    'collection should be null or object'
  );
  
  const typedPayload = payload as ProductListResponse;
  
  // Verify products have required fields
  if (typedPayload.products.length > 0) {
    typedPayload.products.forEach((p) => {
      assert(typeof p.handle === 'string', `Product should have string handle, got ${typeof p.handle}`);
    });
  }
  
  console.log('[ProductListResponse] ✓ Contract verified');
}

async function testProductDetailResponseContract(handle: string): Promise<void> {
  console.log(`[ProductDetailResponse] Testing /api/products/${handle} contract...`);
  
  const payload = await requestJson(`/api/products/${encodeURIComponent(handle)}`);
  
  // Verify structure matches ProductDetailResponse
  assert(payload !== null && typeof payload === 'object', 'Response should be an object');
  assert(
    (payload as Record<string, unknown>).product === null || typeof (payload as Record<string, unknown>).product === 'object',
    'product should be null or object'
  );
  
  const typedPayload = payload as ProductDetailResponse;
  
  // If product exists, verify required fields
  if (typedPayload.product !== null) {
    assert(typeof typedPayload.product.handle === 'string', 'Product should have string handle');
  }
  
  console.log(`[ProductDetailResponse] ✓ Contract verified`);
}

async function testProductDetailNotFound(): Promise<void> {
  console.log('[ProductDetailResponse] Testing 404 error response contract...');
  
  const payload = await requestJson('/api/products/nonexistent-handle-12345');
  const typedPayload = payload as ProductDetailResponse;
  
  // Verify 404 response structure
  assert(typedPayload.product === null, 'product should be null for 404');
  assert(typeof typedPayload.error === 'string' || typedPayload.error === undefined, 'error should be string or undefined');
  
  console.log('[ProductDetailResponse] ✓ 404 error response contract verified');
}

async function main(): Promise<void> {
  try {
    console.log('Starting Product API contract regression tests...\n');
    
    // Test list endpoint
    await testProductListResponseContract();
    
    // Test detail endpoint with known product
    // Using a generic handle that should exist in most Shopify stores
    await testProductDetailResponseContract('mtm-trouser-test-build');
    
    // Test 404 scenario
    await testProductDetailNotFound();
    
    console.log('\n✅ Product API contract regression checks passed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Product API contract regression test failed:');
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
