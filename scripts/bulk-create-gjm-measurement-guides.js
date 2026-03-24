import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const DRY_RUN = process.env.DRY_RUN_GUIDES !== 'false';

/**
 * MEASUREMENT GUIDES - 3-Tier Production Strategy
 *
 * Only 3 measurement guides are seeded:
 * 1. Bespoke - Master Male Draft (Jacket + Trouser)
 * 2. Shirts - Male
 * 3. Shirts - Female
 *
 * All other MTM products use in-person fitting sessions.
 */
const measurementGuides = [
  {
    handle: 'bespoke_male_master_draft',
    category: 'bespoke',
    fields: JSON.stringify([
      { key: 'neck', label: 'Neck', unit: 'cm', required: true, order: 1, section: 'jacket' },
      { key: 'shoulder', label: 'Shoulder', unit: 'cm', required: true, order: 2, section: 'jacket' },
      { key: 'chest', label: 'Chest', unit: 'cm', required: true, order: 3, section: 'jacket' },
      { key: 'across_chest', label: 'Across Chest', unit: 'cm', required: true, order: 4, section: 'jacket' },
      { key: 'across_back', label: 'Across Back', unit: 'cm', required: true, order: 5, section: 'jacket' },
      { key: 'upper_stomach', label: 'Upper Stomach', unit: 'cm', required: true, order: 6, section: 'jacket' },
      { key: 'stomach', label: 'Stomach', unit: 'cm', required: true, order: 7, section: 'jacket' },
      { key: 'waistline', label: 'Waistline', unit: 'cm', required: true, order: 8, section: 'jacket' },
      { key: 'hips', label: 'Hips', unit: 'cm', required: true, order: 9, section: 'jacket' },
      { key: 'sleeve', label: 'Sleeve', unit: 'cm', required: true, order: 10, section: 'jacket' },
      { key: 'biceps', label: 'Biceps', unit: 'cm', required: true, order: 11, section: 'jacket' },
      { key: 'armhole', label: 'Armhole', unit: 'cm', required: true, order: 12, section: 'jacket' },
      { key: 'wrist', label: 'Wrist', unit: 'cm', required: true, order: 13, section: 'jacket' },
      { key: 'length', label: 'Length', unit: 'cm', required: true, order: 14, section: 'jacket' },
      { key: 'back_length', label: 'Back length', unit: 'cm', required: true, order: 15, section: 'jacket' },
      { key: 'trouser_waist', label: 'Waist', unit: 'cm', required: true, order: 16, section: 'trouser' },
      { key: 'trouser_hips', label: 'Hips', unit: 'cm', required: true, order: 17, section: 'trouser' },
      { key: 'crotch', label: 'Crotch', unit: 'cm', required: true, order: 18, section: 'trouser' },
      { key: 'thigh', label: 'Thigh', unit: 'cm', required: true, order: 19, section: 'trouser' },
      { key: 'knee', label: 'Knee', unit: 'cm', required: true, order: 20, section: 'trouser' },
      { key: 'cuff', label: 'Cuff', unit: 'cm', required: true, order: 21, section: 'trouser' },
      { key: 'inseam', label: 'Inseam', unit: 'cm', required: true, order: 22, section: 'trouser' },
      { key: 'trouser_length', label: 'Length', unit: 'cm', required: true, order: 23, section: 'trouser' }
    ], null, 2),
    instructional_fields: JSON.stringify([
      { key: 'neck', title: 'Neck', instruction: 'Measure around the neck to desired fit.', section: 'jacket' },
      { key: 'shoulder', title: 'Shoulder', instruction: 'Measure from one shoulder point to the other.', section: 'jacket' },
      { key: 'chest', title: 'Chest', instruction: 'Measure around the chest & back - widest area.', section: 'jacket' },
      { key: 'across_chest', title: 'Across Chest', instruction: 'Measure 2.5cm down from armpit point across the chest - left to right armpit.', section: 'jacket' },
      { key: 'across_back', title: 'Across Back', instruction: 'Measure 2.5cm down from armpit point across the back - left to right armpit.', section: 'jacket' },
      { key: 'upper_stomach', title: 'Upper Stomach', instruction: 'Measure neck point to below chest.', section: 'jacket' },
      { key: 'stomach', title: 'Stomach', instruction: 'Measure around the stomach at widest area.', section: 'jacket' },
      { key: 'waistline', title: 'Waistline', instruction: 'Measure around waist at widest area.', section: 'jacket' },
      { key: 'hips', title: 'Hips', instruction: 'Measure around the hips at widest area.', section: 'jacket' },
      { key: 'sleeve', title: 'Sleeve', instruction: 'Measure from shoulder point to wrist at desired length.', section: 'jacket' },
      { key: 'biceps', title: 'Biceps', instruction: 'Measure around the bicep at widest area.', section: 'jacket' },
      { key: 'armhole', title: 'Armhole', instruction: 'Measure around the armhole to top of shoulder seam.', section: 'jacket' },
      { key: 'wrist', title: 'Wrist', instruction: 'Measure around the wrist for perfect fit opening.', section: 'jacket' },
      { key: 'length', title: 'Length', instruction: 'Measure from neck point to upper thumb knuckle.', section: 'jacket' },
      { key: 'back_length', title: 'Back length', instruction: 'Measure from neck (top of back) to waist line.', section: 'jacket' },
      { key: 'trouser_waist', title: 'Waist', instruction: 'Measure around the waist at widest area.', section: 'trouser' },
      { key: 'trouser_hips', title: 'Hips', instruction: 'Measure around hips at widest areas.', section: 'trouser' },
      { key: 'crotch', title: 'Crotch', instruction: 'Measure from front waist to back waist point for desired fit.', section: 'trouser' },
      { key: 'thigh', title: 'Thigh', instruction: 'Measure around thigh at widest area.', section: 'trouser' },
      { key: 'knee', title: 'Knee', instruction: 'Measure around knee for desired fit.', section: 'trouser' },
      { key: 'cuff', title: 'Cuff', instruction: 'Measure around ankle for desired fit.', section: 'trouser' },
      { key: 'inseam', title: 'Inseam', instruction: 'Measure from groin to desired length.', section: 'trouser' },
      { key: 'trouser_length', title: 'Length', instruction: 'Measure from waist to desired length.', section: 'trouser' }
    ], null, 2)
  },
  {
    handle: 'shirt_male',
    category: 'shirt',
    fields: JSON.stringify([
      { key: 'neck', label: 'Neck', unit: 'cm', required: true, order: 1 },
      { key: 'shoulders', label: 'Shoulders', unit: 'cm', required: true, order: 2 },
      { key: 'chest', label: 'Chest', unit: 'cm', required: true, order: 3 },
      { key: 'stomach', label: 'Stomach', unit: 'cm', required: true, order: 4 },
      { key: 'hips', label: 'Hips', unit: 'cm', required: true, order: 5 },
      { key: 'sleeves', label: 'Sleeves', unit: 'cm', required: true, order: 6 },
      { key: 'biceps', label: 'Biceps', unit: 'cm', required: true, order: 7 },
      { key: 'wrist_cuff', label: 'Wrist/Cuff', unit: 'cm', required: true, order: 8 },
      { key: 'length_front', label: 'Length Front', unit: 'cm', required: true, order: 9 },
      { key: 'length_back', label: 'Length Back', unit: 'cm', required: true, order: 10 }
    ], null, 2),
    instructional_fields: JSON.stringify([
      { key: 'neck', title: 'Neck', instruction: 'Measure around the neck to desired fit.' },
      { key: 'shoulders', title: 'Shoulders', instruction: 'Measure from one shoulder point to the other.' },
      { key: 'chest', title: 'Chest', instruction: 'Measure around the chest & back - widest area.' },
      { key: 'stomach', title: 'Stomach', instruction: 'Measure around the stomach at widest area.' },
      { key: 'hips', title: 'Hips', instruction: 'Measure around the hips at widest area.' },
      { key: 'sleeves', title: 'Sleeves', instruction: 'Measure from shoulder point to wrist at desired length.' },
      { key: 'biceps', title: 'Biceps', instruction: 'Measure around the bicep at widest area.' },
      { key: 'wrist_cuff', title: 'Wrist/Cuff', instruction: 'Measure around the wrist.' },
      { key: 'length_front', title: 'Length Front', instruction: 'Measure from neck point (on shoulder seam) to upper thumb knuckle.' },
      { key: 'length_back', title: 'Length Back', instruction: 'Measure from neck (top of back) to desired length.' }
    ], null, 2)
  },
  {
    handle: 'shirt_female',
    category: 'shirt',
    fields: JSON.stringify([
      { key: 'neck', label: 'Neck', unit: 'cm', required: true, order: 1 },
      { key: 'shoulders', label: 'Shoulders', unit: 'cm', required: true, order: 2 },
      { key: 'bust', label: 'Bust', unit: 'cm', required: true, order: 3 },
      { key: 'waist', label: 'Waist', unit: 'cm', required: true, order: 4 },
      { key: 'hips', label: 'Hips', unit: 'cm', required: true, order: 5 },
      { key: 'sleeves', label: 'Sleeves', unit: 'cm', required: true, order: 6 },
      { key: 'biceps', label: 'Biceps', unit: 'cm', required: true, order: 7 },
      { key: 'wrist_cuff', label: 'Wrist/Cuff', unit: 'cm', required: true, order: 8 },
      { key: 'blouse_length_front', label: 'Blouse Length Front', unit: 'cm', required: true, order: 9 },
      { key: 'length_back', label: 'Length Back', unit: 'cm', required: true, order: 10 }
    ], null, 2),
    instructional_fields: JSON.stringify([
      { key: 'neck', title: 'Neck', instruction: 'Measure around the neck to desired fit.' },
      { key: 'shoulders', title: 'Shoulders', instruction: 'Measure from the edge of one shoulder bone across the neck to the other shoulder bone.' },
      { key: 'bust', title: 'Bust', instruction: 'Measure around the fullest part of the bust.' },
      { key: 'waist', title: 'Waist', instruction: 'Measure around the natural waist at widest area.' },
      { key: 'hips', title: 'Hips', instruction: 'Measure around the hips at widest area.' },
      { key: 'sleeves', title: 'Sleeves', instruction: 'Measure from the shoulder seam down to the desired cuff length.' },
      { key: 'biceps', title: 'Biceps', instruction: 'Measure around the fullest part of your upper arm.' },
      { key: 'wrist_cuff', title: 'Wrist/Cuff', instruction: 'Measure around the wrist.' },
      { key: 'blouse_length_front', title: 'Blouse Length Front', instruction: 'Measure from the high point of the shoulder to the desired hemline.' },
      { key: 'length_back', title: 'Length Back', instruction: 'Measure from neck (top of back) to desired length.' }
    ], null, 2)
  }
];

async function upsertMeasurementGuide(guide) {
  const mutation = `
    mutation upsertGuide($handle: String!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: { type: "gjm_measurement_guide", handle: $handle }, metaobject: $metaobject) {
        metaobject {
          id
          handle
          displayName
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    handle: guide.handle,
    metaobject: {
      capabilities: {
        publishable: {
          status: 'ACTIVE'
        }
      },
      fields: [
        { key: 'category', value: guide.category },
        { key: 'fields', value: guide.fields },
        { key: 'instructional_fields', value: guide.instructional_fields }
      ]
    }
  };

  if (DRY_RUN) {
    console.log(`DRY_RUN ${guide.handle} -> ${guide.category}`);
    return { dryRun: true };
  }

  const result = await shopifyAdminGraphQL(mutation, variables);
  const userErrors = result?.data?.metaobjectUpsert?.userErrors || [];

  if (userErrors.length > 0) {
    console.error(`ERROR ${guide.handle}:`, JSON.stringify(userErrors));
    return false;
  }

  console.log(`OK ${guide.handle} (${guide.category})`);
  return true;
}

async function bulkCreate() {
  console.log(`Preparing ${measurementGuides.length} gjm_measurement_guide entries. DRY_RUN=${DRY_RUN}`);
  console.log('3-Tier Production Strategy: Bespoke Male, Shirt Male, Shirt Female\n');

  let okCount = 0;
  for (const guide of measurementGuides) {
    const ok = await upsertMeasurementGuide(guide);
    if (ok) okCount += 1;
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  if (DRY_RUN) {
    console.log('\nTo actually write measurement guides to Shopify');
    console.log("Run:");
    console.log("$env:DRY_RUN_GUIDES='false'; node scripts/bulk-create-gjm-measurement-guides.js");
  } else {
    console.log(`\nCompleted. Upserted ${okCount}/${measurementGuides.length} gjm_measurement_guide entries.`);
  }
}

bulkCreate().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
