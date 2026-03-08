import { shopifyAdminGraphQL } from '../lib/shopify';

async function main() {
  console.log('Creating required Shopify metafields and metaobjects...');

  const query = `
    mutation metafieldDefinitionCreate($definitions: [MetafieldDefinitionInput!]!) {
      metafieldDefinitionCreate(definitions: $definitions) {
        createdDefinitions {
          id
          name
          namespace
          key
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const definitions = [
    {
      name: 'MTM Required',
      namespace: 'mtm',
      key: 'required',
      type: 'boolean',
      ownerType: 'PRODUCT',
    },
    {
      name: 'MTM Category',
      namespace: 'mtm',
      key: 'category',
      type: 'single_line_text_field',
      ownerType: 'PRODUCT',
    },
    {
      name: 'MTM Base Block',
      namespace: 'mtm',
      key: 'base_block',
      type: 'single_line_text_field',
      ownerType: 'PRODUCT',
    },
    {
      name: 'Customization Schema',
      namespace: 'mtm',
      key: 'customization_schema',
      type: 'json',
      ownerType: 'PRODUCT',
    },
    {
      name: 'MTM Filter Tags',
      namespace: 'mtm',
      key: 'filter_tags',
      type: 'multi_line_text_field',
      ownerType: 'COLLECTION',
    },
    {
      name: 'Fit Profile ID',
      namespace: 'customer',
      key: 'fit_profile_id',
      type: 'single_line_text_field',
      ownerType: 'CUSTOMER',
    },
    {
      name: 'Preferred Size',
      namespace: 'customer',
      key: 'preferred_size',
      type: 'single_line_text_field',
      ownerType: 'CUSTOMER',
    },
  ];

  const res = await shopifyAdminGraphQL(query, { definitions });
  console.log(JSON.stringify(res, null, 2));
}

main().catch(console.error);
