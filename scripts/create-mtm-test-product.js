import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const DRY_RUN = process.env.DRY_RUN_PRODUCT !== 'false';

// You can override these from env without editing the script.
const PRODUCT_TITLE = process.env.MTM_TEST_PRODUCT_TITLE || 'VST - Made-to-Measure Two-Piece Suit';
const PRODUCT_HANDLE = process.env.MTM_TEST_PRODUCT_HANDLE || 'vst-made-to-measure-two-piece-suit';
const PRODUCT_VENDOR = process.env.MTM_TEST_PRODUCT_VENDOR || 'Germaine Joseph';
const PRODUCT_PRICE = process.env.MTM_TEST_PRODUCT_PRICE || '1499.00';
const PRODUCT_COMPARE_AT = process.env.MTM_TEST_PRODUCT_COMPARE_AT || '2499.00';

const OPTION_SETS = {
  business_suit: 'gid://shopify/Metaobject/144727834660',
};

const MEASUREMENT_GUIDES = {
  bespoke_male_master_draft: 'gid://shopify/Metaobject/144731832356',
};

const PRODUCT_DESCRIPTION_HTML = `
<p>Experience the perfect fit with our made-to-measure two-piece suit. Crafted from premium fabrics and tailored to your exact measurements, this bespoke suit combines timeless elegance with modern sophistication.</p>
<p><strong>Features:</strong></p>
<ul>
<li>Custom-tailored to your measurements</li>
<li>Choice of premium fabrics from renowned mills</li>
<li>Fully customizable options including lapel style, pocket details, and lining</li>
<li>Expert craftsmanship with attention to detail</li>
<li>Perfect for business, weddings, and formal occasions</li>
</ul>
`;

async function findProductByHandle(handle) {
  const query = `
    query FindProductByHandle($query: String!) {
      products(first: 1, query: $query) {
        edges {
          node {
            id
            title
            handle
            status
            productType
            variants(first: 1) {
              edges {
                node {
                  id
                  price
                  compareAtPrice
                }
              }
            }
            option_set: metafield(namespace: "gjm", key: "option_set") { value }
            measurement_guide: metafield(namespace: "gjm", key: "measurement_guide") { value }
          }
        }
      }
    }
  `;

  const result = await shopifyAdminGraphQL(query, { query: `handle:${handle}` });
  return result?.data?.products?.edges?.[0]?.node || null;
}

async function upsertProduct(existingProduct) {
  const mutation = existingProduct
    ? `
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            handle
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `
    : `
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

  const input = {
    ...(existingProduct ? { id: existingProduct.id } : {}),
    title: PRODUCT_TITLE,
    handle: PRODUCT_HANDLE,
    descriptionHtml: PRODUCT_DESCRIPTION_HTML,
    vendor: PRODUCT_VENDOR,
    productType: 'Suits',
    tags: ['MTM', 'Bespoke', 'Suit', 'VerticalSliceTest', 'Custom Tailoring'],
    status: 'ACTIVE',
    seo: {
      title: 'Made-to-Measure Two-Piece Suit | Custom Tailored | Germaine Joseph',
      description: 'Premium made-to-measure two-piece suit tailored to exact measurements. Choose luxury fabrics and customize every detail.',
    },
    metafields: [
      {
        namespace: 'gjm',
        key: 'option_set',
        value: OPTION_SETS.business_suit,
        type: 'metaobject_reference',
      },
      {
        namespace: 'gjm',
        key: 'measurement_guide',
        value: MEASUREMENT_GUIDES.bespoke_male_master_draft,
        type: 'metaobject_reference',
      },
    ],
  };

  if (DRY_RUN) {
    console.log(`DRY_RUN ${existingProduct ? 'UPDATE' : 'CREATE'} product`);
    console.log(`  title: ${PRODUCT_TITLE}`);
    console.log(`  handle: ${PRODUCT_HANDLE}`);
    console.log(`  vendor: ${PRODUCT_VENDOR}`);
    console.log(`  price: ${PRODUCT_PRICE}`);
    console.log(`  compareAtPrice: ${PRODUCT_COMPARE_AT}`);
    console.log(`  gjm.option_set: ${OPTION_SETS.business_suit}`);
    console.log(`  gjm.measurement_guide: ${MEASUREMENT_GUIDES.bespoke_male_master_draft}`);
    return { dryRun: true };
  }

  const result = await shopifyAdminGraphQL(mutation, { input });
  if (result?.errors?.length > 0) {
    throw new Error(`${existingProduct ? 'productUpdate' : 'productCreate'} GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  const key = existingProduct ? 'productUpdate' : 'productCreate';
  const payload = result?.data?.[key];
  const userErrors = payload?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(`${key} failed: ${JSON.stringify(userErrors)}`);
  }

  if (!payload?.product) {
    throw new Error(`${key} returned no product payload: ${JSON.stringify(result)}`);
  }

  return payload?.product || null;
}

async function updateFirstVariantPricing(productId) {
  const getVariantQuery = `
    query GetFirstVariant($id: ID!) {
      product(id: $id) {
        id
        variants(first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
    }
  `;

  const variantResult = await shopifyAdminGraphQL(getVariantQuery, { id: productId });
  const variantId = variantResult?.data?.product?.variants?.edges?.[0]?.node?.id;
  if (!variantId) {
    console.log('No variant found to update pricing.');
    return;
  }

  const priceMutation = `
    mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          compareAtPrice
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const result = await shopifyAdminGraphQL(priceMutation, {
    productId,
    variants: [
      {
        id: variantId,
        price: PRODUCT_PRICE,
        compareAtPrice: PRODUCT_COMPARE_AT,
      },
    ],
  });

  if (result?.errors?.length > 0) {
    throw new Error(`productVariantsBulkUpdate GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  const userErrors = result?.data?.productVariantsBulkUpdate?.userErrors || [];
  if (userErrors.length > 0) {
    throw new Error(`productVariantsBulkUpdate failed: ${JSON.stringify(userErrors)}`);
  }
}

async function verifyProduct(productId) {
  const query = `
    query VerifyProduct($id: ID!) {
      product(id: $id) {
        id
        title
        handle
        status
        productType
        tags
        option_set: metafield(namespace: "gjm", key: "option_set") { value }
        measurement_guide: metafield(namespace: "gjm", key: "measurement_guide") { value }
        variants(first: 1) {
          edges {
            node {
              id
              price
              compareAtPrice
            }
          }
        }
      }
    }
  `;

  const result = await shopifyAdminGraphQL(query, { id: productId });
  return result?.data?.product || null;
}

async function createMTMProduct() {
  console.log(`Preparing MTM vertical-slice product. DRY_RUN=${DRY_RUN}`);

  const existing = await findProductByHandle(PRODUCT_HANDLE);
  if (existing) {
    console.log(`Found existing product for handle '${PRODUCT_HANDLE}': ${existing.id}`);
  } else {
    console.log(`No product found for handle '${PRODUCT_HANDLE}'.`);
  }

  const product = await upsertProduct(existing);
  if (DRY_RUN) {
    console.log('\nTo create/update this product in Shopify:');
    console.log("$env:DRY_RUN_PRODUCT='false'; node scripts/create-mtm-test-product.js");
    return;
  }

  if (!product?.id) {
    throw new Error('No product returned by Shopify.');
  }

  await updateFirstVariantPricing(product.id);

  const snapshot = await verifyProduct(product.id);
  const variant = snapshot?.variants?.edges?.[0]?.node || null;

  console.log('\nMTM vertical-slice product is ready:');
  console.log(JSON.stringify({
    id: snapshot?.id || product.id,
    title: snapshot?.title || product.title,
    handle: snapshot?.handle || product.handle,
    status: snapshot?.status || product.status,
    productType: snapshot?.productType || null,
    option_set: snapshot?.option_set?.value || null,
    measurement_guide: snapshot?.measurement_guide?.value || null,
    price: variant?.price || null,
    compareAtPrice: variant?.compareAtPrice || null,
  }, null, 2));

  console.log('\nReady for vertical slice test.');
}

createMTMProduct().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
