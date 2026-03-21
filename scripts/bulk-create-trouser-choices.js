import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { shopifyAdminGraphQL } = await import('../lib/shopify.ts');

const DRY_RUN = process.env.DRY_RUN_TROUSER_CHOICES !== 'false';

// 53 choices from trouser-core-v1 schema
const trouserChoices = [
  { handle: 'tr_style_dress_pants', value: 'dress_pants', label: 'Dress Pants', price_delta: '0', tags: 'style' },
  { handle: 'tr_style_chinos', value: 'chinos', label: 'Chinos', price_delta: '0', tags: 'style' },
  { handle: 'tr_style_linen_pants', value: 'linen_pants', label: 'Linen Pants', price_delta: '0', tags: 'style' },
  { handle: 'tr_style_jeans', value: 'jeans', label: 'Jeans', price_delta: '0', tags: 'style' },
  { handle: 'tr_style_corduroy_pants', value: 'corduroy_pants', label: 'Corduroy Pants', price_delta: '0', tags: 'style' },
  { handle: 'tr_style_drawstring', value: 'drawstring', label: 'Drawstring', price_delta: '20', tags: 'style' },
  { handle: 'tr_style_wide_leg_pants', value: 'wide_leg_pants', label: 'Wide Leg Pants', price_delta: '30', tags: 'style' },

  { handle: 'tr_fit_slim', value: 'slim', label: 'Slim', price_delta: '0', tags: 'fit' },
  { handle: 'tr_fit_regular_tailored', value: 'regular_tailored', label: 'Regular (Tailored)', price_delta: '0', tags: 'fit' },
  { handle: 'tr_fit_classic', value: 'classic', label: 'Classic', price_delta: '0', tags: 'fit' },

  { handle: 'tr_front_flat_front', value: 'flat_front', label: 'Flat Front', price_delta: '0', tags: 'front_style' },
  { handle: 'tr_front_single_pleat', value: 'single_pleat', label: 'Single Pleat', price_delta: '20', tags: 'front_style' },
  { handle: 'tr_front_double_pleats', value: 'double_pleats', label: 'Double Pleats', price_delta: '30', tags: 'front_style' },
  { handle: 'tr_front_double_pleats_flap', value: 'double_pleats_decorative_flap_pocket', label: 'Double Pleats with Decorative Flap Pocket', price_delta: '45', tags: 'front_style' },

  { handle: 'tr_buttons_real_horn', value: 'real_horn', label: 'Real Horn', price_delta: '20', tags: 'buttons' },
  { handle: 'tr_buttons_real_mop', value: 'real_mother_of_pearl', label: 'Real Mother of Pearl', price_delta: '25', tags: 'buttons' },
  { handle: 'tr_buttons_metal_plate', value: 'metal_plate', label: 'Metal Plate', price_delta: '20', tags: 'buttons' },
  { handle: 'tr_buttons_double_mop_imit', value: 'double_treatment_mother_of_pearl_imitation', label: 'Double Treatment of Mother of Pearl Imitation', price_delta: '10', tags: 'buttons' },
  { handle: 'tr_buttons_mop_imit', value: 'mother_of_pearl_imitation', label: 'Mother of Pearl Imitation', price_delta: '0', tags: 'buttons' },
  { handle: 'tr_buttons_horn_imit', value: 'horn_imitation', label: 'Horn Imitation', price_delta: '0', tags: 'buttons' },
  { handle: 'tr_buttons_ceremony', value: 'ceremony_button', label: 'Ceremony Button', price_delta: '25', tags: 'buttons' },
  { handle: 'tr_buttons_metal_crest', value: 'metal_with_crest', label: 'Metal with Crest', price_delta: '30', tags: 'buttons' },

  { handle: 'tr_waistband_belt_loops', value: 'belt_loops', label: 'Belt Loops', price_delta: '0', tags: 'waistband' },
  { handle: 'tr_waistband_side_adjusters', value: 'side_adjusters', label: 'Side Adjusters', price_delta: '25', tags: 'waistband' },
  { handle: 'tr_waistband_suspender_buttons', value: 'suspender_buttons', label: 'Suspender Buttons', price_delta: '20', tags: 'waistband' },
  { handle: 'tr_waistband_gurkha', value: 'gurkha', label: 'Gurkha', price_delta: '60', tags: 'waistband' },

  { handle: 'tr_fastening_button_closure', value: 'button_closure', label: 'Button Closure', price_delta: '0', tags: 'fastening' },
  { handle: 'tr_fastening_hook_bar', value: 'hook_and_bar', label: 'Hook and Bar', price_delta: '0', tags: 'fastening' },
  { handle: 'tr_fastening_extended_tab', value: 'extended_tab', label: 'Extended Tab', price_delta: '10', tags: 'fastening' },
  { handle: 'tr_fastening_split_tab_buttons', value: 'split_tab_with_buttons', label: 'Split Tab with Buttons', price_delta: '20', tags: 'fastening' },
  { handle: 'tr_fastening_tab_button', value: 'tab_with_button_closure', label: 'Tab with Button Closure', price_delta: '10', tags: 'fastening' },

  { handle: 'tr_fly_zipper', value: 'zipper', label: 'Zipper', price_delta: '0', tags: 'fly' },
  { handle: 'tr_fly_buttons', value: 'buttons', label: 'Buttons', price_delta: '15', tags: 'fly' },

  { handle: 'tr_fp_slant', value: 'slant', label: 'Slant', price_delta: '0', tags: 'front_pockets' },
  { handle: 'tr_fp_on_seam', value: 'on_seam_pockets', label: 'On-Seam Pockets', price_delta: '0', tags: 'front_pockets' },
  { handle: 'tr_fp_western', value: 'western_pockets', label: 'Western Pockets', price_delta: '15', tags: 'front_pockets' },
  { handle: 'tr_fp_coin', value: 'coin_pocket', label: 'Coin Pocket', price_delta: '10', tags: 'front_pockets' },

  { handle: 'tr_bp_welt', value: 'welt', label: 'Welt', price_delta: '0', tags: 'back_pockets' },
  { handle: 'tr_bp_patch', value: 'patch_pockets', label: 'Patch Pockets', price_delta: '10', tags: 'back_pockets' },
  { handle: 'tr_bp_flap_button', value: 'flap_pockets_button_closure', label: 'Flap Pockets with Button Closure', price_delta: '15', tags: 'back_pockets' },
  { handle: 'tr_bp_jetted_button', value: 'jetted_pockets_button_closure', label: 'Jetted Pockets with Button Closure', price_delta: '15', tags: 'back_pockets' },

  { handle: 'tr_lining_front_half', value: 'front_half', label: 'Front Half', price_delta: '0', tags: 'lining' },
  { handle: 'tr_lining_back_half', value: 'back_half', label: 'Back Half', price_delta: '0', tags: 'lining' },
  { handle: 'tr_lining_front_back_half', value: 'front_and_back_half', label: 'Front and Back Half', price_delta: '15', tags: 'lining' },
  { handle: 'tr_lining_full_leg', value: 'full_leg', label: 'Full Leg', price_delta: '30', tags: 'lining' },

  { handle: 'tr_hem_plain', value: 'plain_hem', label: 'Plain Hem', price_delta: '0', tags: 'hem_style' },
  { handle: 'tr_hem_turn_up', value: 'turn_up', label: 'Turn Up', price_delta: '20', tags: 'hem_style' },
  { handle: 'tr_hem_angled', value: 'angled', label: 'Angled', price_delta: '15', tags: 'hem_style' },
  { handle: 'tr_hem_unfinished', value: 'unfinished', label: 'Unfinished', price_delta: '0', tags: 'hem_style' },

  { handle: 'tr_tux_none', value: 'none', label: 'None', price_delta: '0', tags: 'tuxedo_contrast' },
  { handle: 'tr_tux_satin_inseam', value: 'silk_satin_inseam', label: 'Silk Satin Inseam', price_delta: '40', tags: 'tuxedo_contrast' },
  { handle: 'tr_tux_satin_waistband', value: 'silk_satin_waistband', label: 'Silk Satin Waistband', price_delta: '40', tags: 'tuxedo_contrast' },
  { handle: 'tr_tux_full_trim', value: 'full_tuxedo_trim', label: 'Full Tuxedo Trim', price_delta: '80', tags: 'tuxedo_contrast' },
];

const mutation = `
  mutation MetaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject {
        id
        handle
        displayName
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

async function upsertChoice(choice) {
  const variables = {
    handle: {
      type: 'gjm_choice',
      handle: choice.handle,
    },
    metaobject: {
      fields: [
        { key: 'value', value: choice.value },
        { key: 'label', value: choice.label },
        { key: 'price_delta', value: choice.price_delta },
        { key: 'tags', value: JSON.stringify([choice.tags]) },
      ],
    },
  };

  const result = await shopifyAdminGraphQL(mutation, variables);
  const topErrors = result?.errors || [];
  const userErrors = result?.data?.metaobjectUpsert?.userErrors || [];

  if (topErrors.length || userErrors.length) {
    const payload = { topErrors, userErrors };
    throw new Error(JSON.stringify(payload));
  }

  return result?.data?.metaobjectUpsert?.metaobject || null;
}

async function run() {
  console.log(`Preparing ${trouserChoices.length} trouser choices. DRY_RUN=${DRY_RUN}`);

  let ok = 0;
  for (const choice of trouserChoices) {
    if (DRY_RUN) {
      console.log(`DRY_RUN ${choice.handle}`);
      continue;
    }

    try {
      const obj = await upsertChoice(choice);
      if (obj) {
        ok += 1;
        console.log(`OK ${choice.handle}`);
      }
    } catch (err) {
      console.error(`ERROR ${choice.handle}: ${err.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 120));
  }

  if (DRY_RUN) {
    console.log('\nRun live:');
    console.log("$env:DRY_RUN_TROUSER_CHOICES='false'; node scripts/bulk-create-trouser-choices.js");
  } else {
    console.log(`\nCompleted ${ok}/${trouserChoices.length} trouser choices.`);
  }
}

run().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
