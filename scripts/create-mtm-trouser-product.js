import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const DRY_RUN = process.env.DRY_RUN_TROUSER_PRODUCT !== 'false';

const PRODUCT_TITLE = process.env.MTM_TROUSER_TEST_PRODUCT_TITLE || 'VST - Made-to-Measure Dress Pants';
const PRODUCT_HANDLE = process.env.MTM_TROUSER_TEST_PRODUCT_HANDLE || 'vst-made-to-measure-dress-pants';
const PRODUCT_VENDOR = process.env.MTM_TROUSER_TEST_PRODUCT_VENDOR || 'Germaine Joseph';
const PRODUCT_PRICE = process.env.MTM_TROUSER_TEST_PRODUCT_PRICE || '399.00';
const PRODUCT_COMPARE_AT = process.env.MTM_TROUSER_TEST_PRODUCT_COMPARE_AT || '599.00';

const PRODUCT_DESCRIPTION_HTML = `
<p>Expertly crafted made-to-measure dress pants tailored to your exact measurements. Choose from a range of styles, fits, and details to create the perfect trouser for any occasion.</p>
<p><strong>Features:</strong></p>
<ul>
<li>Custom-tailored to your precise measurements</li>
<li>Multiple style options: dress pants, chinos, linen, and more</li>
<li>Fit choices: slim, regular, or classic cut</li>
<li>Customizable construction: waistband, fastening, fly, and lining options</li>
<li>Pocket and hem style personalization</li>
<li>Premium button and detail choices</li>
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

async function upsertProduct(existingProduct, trouserOptionSetGid) {
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
    productType: 'Trousers',
    tags: ['MTM', 'Made-to-Measure', 'Dress Pants', 'VerticalSliceTest'],
    status: 'ACTIVE',
    seo: {
      title: 'Made-to-Measure Dress Pants | Custom Tailored | Germaine Joseph',
      description: 'Premium made-to-measure dress pants tailored to your exact measurements. Customize fit, style, and all details.'
    },
    metafields: [
      {
        namespace: 'gjm',
        key: 'option_set',
        value: trouserOptionSetGid,
        type: 'metaobject_reference'
      },
      {
        namespace: 'gjm',
        key: 'measurement_guide',
        value: 'gid://shopify/Metaobject/144731832356',
        type: 'metaobject_reference'
      }
    ]
  };

  if (DRY_RUN) {
    console.log(`DRY_RUN ${existingProduct ? 'UPDATE' : 'CREATE'} trouser product`);
    console.log(`  title: ${PRODUCT_TITLE}`);
    console.log(`  handle: ${PRODUCT_HANDLE}`);
    console.log(`  vendor: ${PRODUCT_VENDOR}`);
    console.log(`  price: ${PRODUCT_PRICE}`);
    console.log(`  compareAtPrice: ${PRODUCT_COMPARE_AT}`);
    console.log(`  gjm.option_set: ${trouserOptionSetGid}`);
    console.log(`  gjm.measurement_guide: gid://shopify/Metaobject/144731832356`);
    return { dryRun: true };
  }

  const result = await shopifyAdminGraphQL(mutation, { input });
  const key = existingProduct ? 'productUpdate' : 'productCreate';
  const payload = result?.data?.[key];
  const userErrors = payload?.userErrors || [];

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
        compareAtPrice: PRODUCT_COMPARE_AT
      }
    ]
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

async function createTrouserProduct() {
  const trouserOptionSetGid = process.env.MTM_TROUSER_OPTION_SET_GID || 'gid://shopify/Metaobject/0';

  if (trouserOptionSetGid === 'gid://shopify/Metaobject/0') {
    console.error('ERROR: Trouser option set GID not provided.');
    console.error('After seeding trouser options, set:');
    console.error('$env:MTM_TROUSER_OPTION_SET_GID="<GID from bulk-create-trouser-option-set output>"');
    process.exit(1);
  }

  console.log(`Preparing MTM trouser vertical-slice product. DRY_RUN=${DRY_RUN}`);

  const existing = await findProductByHandle(PRODUCT_HANDLE);
  if (existing) {
    console.log(`Found existing product for handle '${PRODUCT_HANDLE}': ${existing.id}`);
  } else {
    console.log(`No product found for handle '${PRODUCT_HANDLE}'.`);
  }

  const product = await upsertProduct(existing, trouserOptionSetGid);
  if (DRY_RUN) {
    console.log('\nTo create/update this trouser product in Shopify:');
    console.log('$env:MTM_TROUSER_OPTION_SET_GID="<trouser_option_set_gid>"');
    console.log("$env:DRY_RUN_TROUSER_PRODUCT='false'; node scripts/create-mtm-trouser-product.js");
    return;
  }

  if (!product?.id) {
    throw new Error('No product returned by Shopify.');
  }

  await updateFirstVariantPricing(product.id);

  const snapshot = await verifyProduct(product.id);
  const variant = snapshot?.variants?.edges?.[0]?.node || null;

  console.log('\nMTM trouser vertical-slice product is ready:');
  console.log(JSON.stringify({
    id: snapshot?.id || product.id,
    title: snapshot?.title || product.title,
    handle: snapshot?.handle || product.handle,
    status: snapshot?.status || product.status,
    productType: snapshot?.productType || null,
    option_set: snapshot?.option_set?.value || null,
    measurement_guide: snapshot?.measurement_guide?.value || null,
    price: variant?.price || null,
    compareAtPrice: variant?.compareAtPrice || null
  }, null, 2));

  console.log('\nReady for vertical slice test.');
}

createTrouserProduct().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
