import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const DRY_RUN = process.env.DRY_RUN_NON_TAILOR_PRODUCT !== 'false';

const PRODUCT_TITLE = process.env.NON_TAILOR_TEST_PRODUCT_TITLE || 'VST - Oxford Shoe (Non-Tailor Config)';
const PRODUCT_HANDLE = process.env.NON_TAILOR_TEST_PRODUCT_HANDLE || 'vst-oxford-shoe-non-tailor-config';
const PRODUCT_VENDOR = process.env.NON_TAILOR_TEST_PRODUCT_VENDOR || 'Germaine Joseph';
const PRODUCT_PRICE = process.env.NON_TAILOR_TEST_PRODUCT_PRICE || '499.00';
const PRODUCT_COMPARE_AT = process.env.NON_TAILOR_TEST_PRODUCT_COMPARE_AT || '699.00';

const PRODUCT_DESCRIPTION_HTML = `
<p>Classic oxford shoe prepared for non-tailor configurator analytics validation.</p>
<ul>
  <li>Category: Shoes</li>
  <li>Flow: configurable_non_tailor</li>
  <li>Purpose: PostHog event smoke testing</li>
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
            mtm_category: metafield(namespace: "gjm", key: "mtm_category") { value }
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
    productType: 'Shoes',
    tags: ['NonTailor', 'Shoes', 'AnalyticsTest', 'VerticalSliceTest'],
    status: 'ACTIVE',
    metafields: [
      {
        namespace: 'gjm',
        key: 'required_fit_gate',
        value: 'false',
        type: 'boolean',
      },
    ],
  };

  if (DRY_RUN) {
    console.log(`DRY_RUN ${existingProduct ? 'UPDATE' : 'CREATE'} non-tailor product`);
    console.log(`  title: ${PRODUCT_TITLE}`);
    console.log(`  handle: ${PRODUCT_HANDLE}`);
    console.log(`  productType: Shoes`);
    console.log(`  gjm.required_fit_gate: false`);
    return { dryRun: true };
  }

  const result = await shopifyAdminGraphQL(mutation, { input });
  const key = existingProduct ? 'productUpdate' : 'productCreate';
  const payload = result?.data?.[key];
  const userErrors = payload?.userErrors || [];

  if (result?.errors?.length) {
    throw new Error(`${key} GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  if (userErrors.length > 0) {
    throw new Error(`${key} failed: ${JSON.stringify(userErrors)}`);
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

async function publishProductToAllChannels(productId) {
  const publicationsQuery = `
    query GetPublications {
      publications(first: 20) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `;

  const publicationsResult = await shopifyAdminGraphQL(publicationsQuery, {});
  const publicationIds = (publicationsResult?.data?.publications?.edges || [])
    .map((edge) => edge?.node?.id)
    .filter(Boolean);

  if (!publicationIds.length) {
    console.log('No publications found; skipping product publishing.');
    return;
  }

  const publishMutation = `
    mutation PublishProduct($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable {
          availablePublicationsCount {
            count
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const publishInput = publicationIds.map((publicationId) => ({ publicationId }));

  const publishResult = await shopifyAdminGraphQL(publishMutation, {
    id: productId,
    input: publishInput,
  });

  const userErrors = publishResult?.data?.publishablePublish?.userErrors || [];
  if (userErrors.length > 0) {
    throw new Error(`publishablePublish failed: ${JSON.stringify(userErrors)}`);
  }

  console.log(`Published product to ${publicationIds.length} publication(s).`);
}

async function createNonTailorProduct() {
  console.log(`Preparing non-tailor test product. DRY_RUN=${DRY_RUN}`);

  const existing = await findProductByHandle(PRODUCT_HANDLE);
  if (existing) {
    console.log(`Found existing product for handle '${PRODUCT_HANDLE}': ${existing.id}`);
  } else {
    console.log(`No product found for handle '${PRODUCT_HANDLE}'.`);
  }

  const product = await upsertProduct(existing);
  if (DRY_RUN) {
    console.log('\nTo create/update this product in Shopify:');
    console.log("$env:DRY_RUN_NON_TAILOR_PRODUCT='false'; node scripts/create-non-tailor-test-product.js");
    return;
  }

  if (!product?.id) {
    throw new Error('No product returned by Shopify.');
  }

  await updateFirstVariantPricing(product.id);
  await publishProductToAllChannels(product.id);

  console.log('\nNon-tailor test product is ready:');
  console.log(JSON.stringify({
    id: product.id,
    title: PRODUCT_TITLE,
    handle: PRODUCT_HANDLE,
    status: product.status,
    productPage: `/product/${PRODUCT_HANDLE}`,
  }, null, 2));
}

createNonTailorProduct().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
