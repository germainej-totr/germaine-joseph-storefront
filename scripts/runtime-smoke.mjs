const baseUrl = (process.env.RUNTIME_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const nonTailorHandle = process.env.NON_TAILOR_RUNTIME_HANDLE || 'vst-oxford-shoe-non-tailor-config';
const mtmHandle = process.env.MTM_RUNTIME_HANDLE || 'qa-mtm-product';
const collectionHandle = process.env.RUNTIME_COLLECTION_HANDLE || '';
const cookieJar = new Map();

function parseMetafieldBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value !== 'string') return false;

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off', ''].includes(normalized)) return false;
  return false;
}

function getCookieHeader() {
  const pairs = Array.from(cookieJar.entries()).map(([name, value]) => `${name}=${value}`);
  return pairs.join('; ');
}

function storeCookies(response) {
  const setCookieHeaders = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);

  for (const header of setCookieHeaders) {
    const cookie = header.split(';')[0] || '';
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex < 1) continue;

    const name = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();

    if (!value) {
      cookieJar.delete(name);
      continue;
    }

    cookieJar.set(name, value);
  }
}

async function request(path, init = {}) {
  const headers = new Headers(init.headers || {});
  const cookieHeader = getCookieHeader();
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }

  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  storeCookies(response);
  return response;
}

async function requestJson(path, init) {
  const response = await request(path, init);
  const text = await response.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    throw new Error(`${path} -> HTTP ${response.status} ${text}`);
  }

  return json;
}

async function requestText(path, init) {
  const response = await request(path, init);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${path} -> HTTP ${response.status} ${text}`);
  }

  return text;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeVariants(product) {
  if (Array.isArray(product?.variants)) {
    return product.variants;
  }

  if (Array.isArray(product?.variants?.edges)) {
    return product.variants.edges.map((edge) => edge?.node).filter(Boolean);
  }

  return [];
}

function resolvePurchasableVariantId(product) {
  const variants = normalizeVariants(product);
  const availableVariant = variants.find((variant) => variant?.availableForSale !== false);
  const fallbackVariant = variants[0];
  const variantId = availableVariant?.id || fallbackVariant?.id;
  assert(variantId, `Expected a purchasable variant for ${product?.handle || 'unknown product'}`);
  return variantId;
}

async function loadCatalogProducts() {
  const payload = await requestJson('/api/products?first=50');
  return Array.isArray(payload?.products) ? payload.products : [];
}

function resolveMtmHandle(products) {
  const configured = products.find((product) => product?.handle === mtmHandle);
  if (configured) {
    return configured.handle;
  }

  const discovered = products.find((product) => product?.mtmRequired === true);
  assert(discovered?.handle, 'Expected at least one MTM product in /api/products?first=50');
  return discovered.handle;
}

async function verifyCatalogClassification() {
  const products = await loadCatalogProducts();

  const nonTailorProduct = products.find((product) => product?.handle === nonTailorHandle);
  assert(nonTailorProduct, `Expected non-tailor product ${nonTailorHandle} in /api/products?first=50`);
  assert(nonTailorProduct.mtmRequired === false, `Expected ${nonTailorHandle} to have mtmRequired=false`);

  const resolvedMtmHandle = resolveMtmHandle(products);
  const mtmProduct = products.find((product) => product?.handle === resolvedMtmHandle);
  assert(mtmProduct, `Expected MTM product ${resolvedMtmHandle} in /api/products?first=50`);
  assert(mtmProduct.mtmRequired === true, `Expected ${resolvedMtmHandle} to have mtmRequired=true`);

  console.log(`OK catalog classification -> ${nonTailorHandle}=false, ${resolvedMtmHandle}=true`);
  return resolvedMtmHandle;
}

async function verifyProductDetail(handle, expectedMtmRequired) {
  const payload = await requestJson(`/api/products/${encodeURIComponent(handle)}`);
  const product = payload?.product;
  assert(product, `Expected product payload for ${handle}`);

  const actual = parseMetafieldBoolean(product?.mtm_required?.value);
  assert(actual === expectedMtmRequired, `Expected ${handle} mtm_required=${expectedMtmRequired} but got ${actual}`);

  const page = await request(`/product/${encodeURIComponent(handle)}`);
  assert(page.ok, `Expected /product/${handle} to return 200`);

  console.log(`OK product detail -> ${handle} mtm_required=${expectedMtmRequired}`);
  return product;
}

async function verifyRoute(path, expectedStatuses) {
  const response = await request(path, { redirect: 'manual' });
  assert(expectedStatuses.includes(response.status), `Expected ${path} status in [${expectedStatuses.join(', ')}], got ${response.status}`);
  console.log(`OK route -> ${path} (${response.status})`);
}

async function resolveCollectionHandle() {
  if (collectionHandle) {
    return collectionHandle;
  }

  const shopHtml = await requestText('/shop');
  const match = shopHtml.match(/href="\/shop\/([^"?#/]+)"/i);
  return match?.[1] || '';
}

async function verifyOptionalCollection() {
  const resolvedCollectionHandle = await resolveCollectionHandle();

  if (!resolvedCollectionHandle) {
    console.log('SKIP collection route -> no collection link discovered from /shop');
    return;
  }

  await verifyRoute(`/shop/${encodeURIComponent(resolvedCollectionHandle)}`, [200]);

  const payload = await requestJson(`/api/products?collection=${encodeURIComponent(resolvedCollectionHandle)}&first=50`);
  assert(Array.isArray(payload?.products), `Expected collection payload array for ${resolvedCollectionHandle}`);

  const classifiedProducts = payload.products.filter((product) => typeof product?.mtmRequired === 'boolean');
  assert(classifiedProducts.length > 0, `Expected classified products in collection ${resolvedCollectionHandle}`);

  const nonTailorProduct = payload.products.find((product) => product?.handle === nonTailorHandle);
  if (nonTailorProduct) {
    assert(nonTailorProduct.mtmRequired === false, `Expected collection ${resolvedCollectionHandle} to preserve non-tailor classification`);
    console.log(`OK collection classification -> ${nonTailorHandle}=false in ${resolvedCollectionHandle}`);
    return;
  }

  console.log(`OK collection route -> ${resolvedCollectionHandle} (${classifiedProducts.length} classified products)`);
}

function findCartLine(lines, handle) {
  return lines.find((line) => line?.merchandise?.product?.handle === handle);
}

function findAttribute(line, key) {
  return line?.attributes?.find((attribute) => attribute?.key === key)?.value;
}

async function verifyCartLifecycle(nonTailorProduct) {
  const variantId = resolvePurchasableVariantId(nonTailorProduct);

  const addPayload = await requestJson('/api/cart/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: nonTailorProduct.id,
      variantId,
      quantity: 1,
      productFlow: 'configurable_non_tailor',
      customAttributes: {
        gjm_runtime_smoke: 'true',
      },
    }),
  });

  assert(addPayload?.ok === true, 'Expected /api/cart/add to succeed');
  assert(addPayload?.cartId, 'Expected /api/cart/add to return a cart ID');

  const cartPayload = await requestJson('/api/cart');
  assert(cartPayload?.ok === true, 'Expected /api/cart to succeed');
  assert(cartPayload?.cart?.checkoutUrl, 'Expected /api/cart to expose a checkoutUrl after cart add');

  const addedLine = findCartLine(cartPayload?.lines || [], nonTailorProduct.handle);
  assert(addedLine?.id, `Expected cart line for ${nonTailorProduct.handle}`);
  assert(addedLine.quantity === 1, 'Expected added cart line quantity to equal 1');
  assert(findAttribute(addedLine, 'gjm_product_flow') === 'configurable_non_tailor', 'Expected gjm_product_flow cart attribute');
  assert(findAttribute(addedLine, 'gjm_runtime_smoke') === 'true', 'Expected gjm_runtime_smoke cart attribute');

  const checkoutResponse = await request('/checkout', { redirect: 'manual' });
  assert([307, 308].includes(checkoutResponse.status), `Expected /checkout redirect status after cart add, got ${checkoutResponse.status}`);

  const updatedCartPayload = await requestJson('/api/cart', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lineId: addedLine.id, quantity: 2 }),
  });

  const updatedLine = findCartLine(updatedCartPayload?.lines || [], nonTailorProduct.handle);
  assert(updatedLine?.quantity === 2, 'Expected updated cart line quantity to equal 2');

  const removedCartPayload = await requestJson('/api/cart', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lineId: addedLine.id }),
  });

  const removedLine = findCartLine(removedCartPayload?.lines || [], nonTailorProduct.handle);
  assert(!removedLine, `Expected ${nonTailorProduct.handle} cart line to be removed`);

  console.log(`OK cart lifecycle -> ${nonTailorProduct.handle} add/update/remove`);
}

async function main() {
  console.log(`Runtime smoke against ${baseUrl}`);

  const resolvedMtmHandle = await verifyCatalogClassification();
  const nonTailorProduct = await verifyProductDetail(nonTailorHandle, false);
  await verifyProductDetail(resolvedMtmHandle, true);
  await verifyRoute('/shop', [200]);
  await verifyOptionalCollection();
  await verifyRoute('/cart', [200]);
  await verifyCartLifecycle(nonTailorProduct);

  console.log('Runtime smoke passed');
}

main().catch((error) => {
  console.error('Runtime smoke failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});