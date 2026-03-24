import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

async function main() {
  const { shopifyAdminGraphQL } = await import('../lib/shopify');
  console.log('Creating required Shopify metafields and metaobjects...');

  const metafieldQuery = `
    mutation metafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
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

  const metaobjectDefinitionQuery = `
    mutation MetaobjectDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition {
          id
          type
          name
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const definitions = [
    // PRODUCT (gjm.*)
    { name: 'Measurement Guide', namespace: 'gjm', key: 'measurement_guide', type: 'metaobject_reference', ownerType: 'PRODUCT' },
    { name: 'MTM Required Fit Gate', namespace: 'gjm', key: 'required_fit_gate', type: 'boolean', ownerType: 'PRODUCT' },
    { name: 'Option Set', namespace: 'gjm', key: 'option_set', type: 'metaobject_reference', ownerType: 'PRODUCT' },
    { name: 'Fabric Reference', namespace: 'gjm', key: 'fabric_ref', type: 'metaobject_reference', ownerType: 'PRODUCT' },
    { name: 'Lead Time (Days)', namespace: 'gjm', key: 'lead_time_days', type: 'number_integer', ownerType: 'PRODUCT' },
    { name: 'Base Pattern Code', namespace: 'gjm', key: 'base_pattern_code', type: 'single_line_text_field', ownerType: 'PRODUCT' },
    { name: 'MTM Category', namespace: 'gjm', key: 'mtm_category', type: 'single_line_text_field', ownerType: 'PRODUCT' },
    { name: 'Price Model', namespace: 'gjm', key: 'price_model', type: 'single_line_text_field', ownerType: 'PRODUCT' },

    // COLLECTION (gjm.*)
    { name: 'Filter Facets', namespace: 'gjm', key: 'filter_facets', type: 'json', ownerType: 'COLLECTION' },
    { name: 'Collection Type', namespace: 'gjm', key: 'collection_type', type: 'single_line_text_field', ownerType: 'COLLECTION' },
    { name: 'Default Collection Set Reference', namespace: 'gjm', key: 'default_collection_set_ref', type: 'metaobject_reference', ownerType: 'COLLECTION' },

    // CUSTOMER (gjm.*)
    { name: 'Height', namespace: 'gjm', key: 'height_cm', type: 'number_decimal', ownerType: 'CUSTOMER' },
    { name: 'Weight', namespace: 'gjm', key: 'weight_kg', type: 'number_decimal', ownerType: 'CUSTOMER' },
    { name: 'Body Build', namespace: 'gjm', key: 'body_build', type: 'single_line_text_field', ownerType: 'CUSTOMER' },
    { name: 'Posture', namespace: 'gjm', key: 'fit_posture', type: 'single_line_text_field', ownerType: 'CUSTOMER' },
    { name: 'Shoulder Slope', namespace: 'gjm', key: 'fit_shoulder_slope', type: 'single_line_text_field', ownerType: 'CUSTOMER' },
    { name: 'Fit Preference', namespace: 'gjm', key: 'fit_preference', type: 'single_line_text_field', ownerType: 'CUSTOMER' },
    { name: 'Style Intent', namespace: 'gjm', key: 'primary_use_case', type: 'single_line_text_field', ownerType: 'CUSTOMER' },
    { name: 'Wedding Date', namespace: 'gjm', key: 'event_date', type: 'date', ownerType: 'CUSTOMER' },
    { name: 'Production Timeline - Urgency', namespace: 'gjm', key: 'timeline_urgency', type: 'single_line_text_field', ownerType: 'CUSTOMER' },
    { name: 'Preferred Appointment Mode', namespace: 'gjm', key: 'preferred_fitting_mode', type: 'single_line_text_field', ownerType: 'CUSTOMER' },
    { name: 'Consent to Profile', namespace: 'gjm', key: 'consent_profile_storage', type: 'boolean', ownerType: 'CUSTOMER' },
    { name: 'Fit Gate Version', namespace: 'gjm', key: 'fit_gate_version', type: 'single_line_text_field', ownerType: 'CUSTOMER' },
    { name: 'Notes to Tailor', namespace: 'gjm', key: 'tailor_notes', type: 'multi_line_text_field', ownerType: 'CUSTOMER' },
    { name: 'Common Fit Issues', namespace: 'gjm', key: 'fit_issues', type: 'multi_line_text_field', ownerType: 'CUSTOMER' },
    { name: 'Trouser Fit Preference', namespace: 'gjm', key: 'trouser_break_preference', type: 'single_line_text_field', ownerType: 'CUSTOMER' },
    { name: 'Trouser Rise Preference', namespace: 'gjm', key: 'trouser_rise_preference', type: 'single_line_text_field', ownerType: 'CUSTOMER' },
    { name: 'Known Sizes', namespace: 'gjm', key: 'current_sizes_json', type: 'json', ownerType: 'CUSTOMER' },
    { name: 'Jacket Length Preference', namespace: 'gjm', key: 'jacket_length_preference', type: 'single_line_text_field', ownerType: 'CUSTOMER' },
    { name: 'Fit Gate Completed At', namespace: 'gjm', key: 'fit_gate_completed_at', type: 'date_time', ownerType: 'CUSTOMER' },
    { name: 'Fit Gate Status', namespace: 'gjm', key: 'fit_gate_status', type: 'single_line_text_field', ownerType: 'CUSTOMER' },

    // ORDER (gjm.*)
    { name: 'Fit Gate Completed At', namespace: 'gjm', key: 'fit_gate_completed_at', type: 'date_time', ownerType: 'ORDER' },
    { name: 'Fit Gate Version Used', namespace: 'gjm', key: 'fit_gate_version', type: 'single_line_text_field', ownerType: 'ORDER' },
    { name: 'Fit Gate Snapshot', namespace: 'gjm', key: 'fit_gate_snapshot', type: 'json', ownerType: 'ORDER' },
  ];

  for (const definition of definitions) {
    const metafieldRes = await shopifyAdminGraphQL(metafieldQuery, {
      definition: {
        ...definition,
        ...(definition.ownerType === 'PRODUCT'
          ? {
              access: {
                storefront: 'PUBLIC_READ',
              },
            }
          : {}),
      },
    });
    console.log(`Metafield definition result (${definition.ownerType}:${definition.namespace}.${definition.key}):`);
    console.log(JSON.stringify(metafieldRes, null, 2));
  }

  const metaobjectDefinitions = [
    {
      name: 'GJ Measurement Guide',
      type: 'gjm_measurement_guide',
      fieldDefinitions: [
        { key: 'category', name: 'Category', type: 'single_line_text_field' },
        { key: 'fields', name: 'Fields', type: 'json' },
        { key: 'media', name: 'Media', type: 'list.file_reference' },
      ],
    },
    {
      name: 'GJ Service Type',
      type: 'gjm_service_type',
      fieldDefinitions: [
        { key: 'name', name: 'Name', type: 'single_line_text_field' },
        { key: 'duration_min', name: 'Duration (Min)', type: 'number_integer' },
        { key: 'deposit_amount', name: 'Deposit Amount', type: 'number_decimal' },
        { key: 'lead_time_hours', name: 'Lead Time (Hours)', type: 'number_integer' },
        { key: 'travel_required', name: 'Travel Required', type: 'boolean' },
        { key: 'zones', name: 'Zones', type: 'json' },
      ],
    },
    {
      name: 'GJ Choice',
      type: 'gjm_choice',
      fieldDefinitions: [
        { key: 'value', name: 'Value', type: 'single_line_text_field' },
        { key: 'label', name: 'Label', type: 'single_line_text_field' },
        { key: 'image', name: 'Image', type: 'file_reference' },
        { key: 'price_delta', name: 'Price Delta', type: 'number_decimal' },
        { key: 'tags', name: 'Tags', type: 'list.single_line_text_field' },
      ],
    },
    {
      name: 'GJ Fabric',
      type: 'gjm_fabric',
      fieldDefinitions: [
        { key: 'fabric_code', name: 'Fabric Code', type: 'single_line_text_field' },
        { key: 'mill', name: 'Mill', type: 'single_line_text_field' },
        { key: 'composition', name: 'Composition', type: 'single_line_text_field' },
        { key: 'weight_gsm', name: 'Weight GSM', type: 'number_integer' },
        { key: 'season', name: 'Season', type: 'single_line_text_field' },
        { key: 'weave', name: 'Weave', type: 'single_line_text_field' },
        { key: 'colour', name: 'Colour', type: 'single_line_text_field' },
        { key: 'swatch_image', name: 'Swatch Image', type: 'file_reference' },
        { key: 'hero_image', name: 'Hero Image', type: 'file_reference' },
        { key: 'price_tier', name: 'Price Tier', type: 'single_line_text_field' },
        { key: 'availability_status', name: 'Availability Status', type: 'single_line_text_field' },
      ],
    },
    {
      name: 'GJ Option',
      type: 'gjm_option',
      fieldDefinitions: [
        { key: 'key', name: 'Key', type: 'single_line_text_field' },
        { key: 'label', name: 'Label', type: 'single_line_text_field' },
        { key: 'type', name: 'Type', type: 'single_line_text_field' },
        { key: 'choices', name: 'Choices', type: 'list.metaobject_reference' },
        { key: 'ui_hint', name: 'UI Hint', type: 'single_line_text_field' },
        { key: 'depends_on', name: 'Depends On', type: 'json' },
        { key: 'validation', name: 'Validation', type: 'json' },
      ],
    },
    {
      name: 'GJ Option Set',
      type: 'gjm_option_set',
      fieldDefinitions: [
        { key: 'title', name: 'Title', type: 'single_line_text_field' },
        { key: 'category', name: 'Category', type: 'single_line_text_field' },
        { key: 'version', name: 'Version', type: 'single_line_text_field' },
        { key: 'options', name: 'Options', type: 'list.metaobject_reference' },
        { key: 'default_config', name: 'Default Config', type: 'json' },
        { key: 'pricing_rules', name: 'Pricing Rules', type: 'json' },
      ],
    },
  ];

  for (const definition of metaobjectDefinitions) {
    const result = await shopifyAdminGraphQL(metaobjectDefinitionQuery, { definition });
    console.log(`Metaobject definition result (${definition.type}):`);
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch(console.error);
