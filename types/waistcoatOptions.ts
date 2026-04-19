export type MtmOptionType =
  | 'radio'
  | 'select'
  | 'toggle'
  | 'text'
  | 'number'
  | 'multiselect';

export type ProductionTier =
  | 'red_label'
  | 'black_label'
  | 'bespoke';

export type MtmChoice = {
  value: string;
  label: string;
  priceDelta?: number;
  productionTier?: ProductionTier;
};

export type DependsOnRule = Record<string, string | string[]>;

export type MtmOption = {
  key: string;
  label: string;
  type: MtmOptionType;
  uiHint: 'cards' | 'buttons' | 'dropdown' | 'text' | 'number';
  required: boolean;
  sortOrder: number;
  section:
    | 'design'
    | 'construction'
    | 'details'
    | 'pockets'
    | 'personalisation';
  dependsOn?: DependsOnRule;
  choices?: MtmChoice[];
  validation?: {
    minLength?: number;
    maxLength?: number;
  };
};

export type WaistcoatPricingRules = {
  black_label: {
    baseRule: string;
    cmtEur: number;
    styleSurchargeEurDefault: number;
    marginCapAud: number;
    inhouseFabricRule: string;
    logisticsEur: number;
  };
  red_label: {
    baseRule: string;
    marginCapAud: number;
    styleSurchargeOverrides: Record<string, number>;
    logisticsEur: number;
  };
  bespoke: {
    baseRule: string;
    logisticsEur: number;
  };
};

export type MtmOptionSet = {
  id: string;
  handle: string;
  title: string;
  category: 'vest';
  version: string;
  options: MtmOption[];
  pricingRules: WaistcoatPricingRules;
};

export const waistcoatOptionSet: MtmOptionSet = {
  id: 'gjm_waistcoat_core_v1',
  handle: 'gjm_waistcoat_core_v1',
  title: 'Waistcoat Core v1',
  category: 'vest',
  version: 'v1',
  options: [
    {
      key: 'style',
      label: 'Style',
      type: 'radio',
      uiHint: 'cards',
      required: true,
      sortOrder: 10,
      section: 'design',
      choices: [
        { value: 'modena_waistcoat_mc1520', label: 'The Modena Waistcoat - MC 1520', priceDelta: 5, productionTier: 'black_label' },
        { value: 'marcello_waistcoat_mc1501', label: 'The Marcello Waistcoat - MC 1501', priceDelta: 5, productionTier: 'black_label' },
        { value: 'shelby_heritage_mc1505', label: 'The Shelby Heritage - MC 1505', priceDelta: 5, productionTier: 'black_label' },
        { value: 'palazzo_shawl_waistcoat_mc1503', label: 'The Palazzo Shawl Waistcoat - MC 1503', priceDelta: 5, productionTier: 'black_label' },
        { value: 'milano_double_breasted_mc1506', label: 'The Milano Double-Breasted - MC 1506', priceDelta: 5, productionTier: 'black_label' },
        { value: 'shelby_heritage_db_mc1502', label: 'The Shelby Heritage DB - MC1502', priceDelta: 5, productionTier: 'black_label' },
        { value: 'sorrento_shawl_mc1507', label: 'The Sorrento Shawl - MC1507', priceDelta: 5, productionTier: 'black_label' },
        { value: 'alfredo_soiree_4btn', label: 'The Alfredo Soiree 4BTN', priceDelta: 0, productionTier: 'red_label' },
        { value: 'alfredo_soiree_5btn', label: 'The Alfredo Soiree 5BTN', priceDelta: 0, productionTier: 'red_label' },
        { value: 'alfredo_soiree_6btn', label: 'The Alfredo Soiree 6BTN', priceDelta: 0, productionTier: 'red_label' },
        { value: 'alphonso_midnight_shawl_5btn', label: 'The Alphonso Midnight Shawl 5BTN', priceDelta: 3, productionTier: 'red_label' },
        { value: 'alphonso_midnight_shawl_6btn', label: 'The Alphonso Midnight Shawl 6BTN', priceDelta: 3, productionTier: 'red_label' },
        { value: 'giacomo_shawl', label: 'The Giacomo Shawl', priceDelta: 3, productionTier: 'red_label' },
        { value: 'gian_francesco_shawl', label: 'The Gian Francesco Shawl', priceDelta: 6, productionTier: 'red_label' },
        { value: 'gian_luigi_ritz_formal', label: 'The Gian Luigi Ritz Formal', priceDelta: 3, productionTier: 'red_label' },
        { value: 'gian_paolo_gala', label: 'The Gian Paolo Gala', priceDelta: 6, productionTier: 'red_label' },
        { value: 'grappelli_waistcoat', label: 'The Grappelli Waistcoat', priceDelta: 0, productionTier: 'red_label' },
        { value: 'mono_palazzo_shawl', label: 'The Mono Palzzo Shawl', priceDelta: 6, productionTier: 'red_label' },
        { value: 'roberto_luca_formal', label: 'The Roberto Luca Formal', priceDelta: 3, productionTier: 'red_label' },
      ],
    },
    {
      key: 'fit',
      label: 'Fit',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 20,
      section: 'design',
      choices: [
        { value: 'slim', label: 'Slim', priceDelta: 0 },
        { value: 'regular', label: 'Regular', priceDelta: 0 },
        { value: 'classic', label: 'Classic', priceDelta: 0 },
      ],
    },
    {
      key: 'breast_style',
      label: 'Breast Style',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 30,
      section: 'construction',
      choices: [
        { value: 'single_breasted', label: 'Single Breasted', priceDelta: 0 },
        { value: 'double_breasted', label: 'Double Breasted', priceDelta: 20 },
      ],
    },
    {
      key: 'lapel_style',
      label: 'Lapel Style',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 40,
      section: 'construction',
      choices: [
        { value: 'none', label: 'None', priceDelta: 0 },
        { value: 'notch', label: 'Notch', priceDelta: 15 },
        { value: 'peak', label: 'Peak', priceDelta: 20 },
        { value: 'shawl', label: 'Shawl', priceDelta: 20 },
      ],
    },
    {
      key: 'front_shape',
      label: 'Front',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 50,
      section: 'construction',
      choices: [
        { value: 'v_shaped', label: 'V-Shaped', priceDelta: 0 },
        { value: 'u_shaped', label: 'U-Shaped', priceDelta: 10 },
      ],
    },
    {
      key: 'button_count',
      label: 'Button Count',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 60,
      section: 'construction',
      choices: [
        { value: '4', label: '4', priceDelta: 0 },
        { value: '5', label: '5', priceDelta: 0 },
        { value: '6', label: '6', priceDelta: 10 },
      ],
    },
    {
      key: 'button_type',
      label: 'Button Type',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 70,
      section: 'details',
      choices: [
        { value: 'fabric_covered', label: 'Fabric Covered', priceDelta: 10 },
        { value: 'horn_imitation', label: 'Horn Imitation', priceDelta: 0 },
        { value: 'real_horn', label: 'Real Horn', priceDelta: 20 },
        { value: 'metal_with_crest', label: 'Metal with Crest', priceDelta: 25 },
      ],
    },
    {
      key: 'decorative_stitching',
      label: 'Decorative Stitching',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 80,
      section: 'details',
      choices: [
        { value: 'false', label: 'No', priceDelta: 0 },
        { value: 'true', label: 'Yes', priceDelta: 15 },
      ],
    },
    {
      key: 'decorative_stitching_type',
      label: 'Decorative Stitching Type',
      type: 'radio',
      uiHint: 'buttons',
      required: false,
      sortOrder: 90,
      section: 'details',
      dependsOn: {
        decorative_stitching: 'true',
      },
      choices: [
        { value: 'amf', label: 'AMF', priceDelta: 0 },
        { value: 'top_stitching', label: 'Top Stitching', priceDelta: 0 },
      ],
    },
    {
      key: 'decorative_stitching_edge_distance',
      label: 'Decorative Stitching - From the Edge',
      type: 'radio',
      uiHint: 'buttons',
      required: false,
      sortOrder: 100,
      section: 'details',
      dependsOn: {
        decorative_stitching: 'true',
      },
      choices: [
        { value: '2mm', label: '2mm', priceDelta: 0 },
        { value: '5mm', label: '5mm', priceDelta: 0 },
        { value: '8mm', label: '8mm', priceDelta: 0 },
      ],
    },
    {
      key: 'decorative_stitching_position',
      label: 'Decorative Stitching - Position',
      type: 'multiselect',
      uiHint: 'buttons',
      required: false,
      sortOrder: 110,
      section: 'details',
      dependsOn: {
        decorative_stitching: 'true',
      },
      choices: [
        { value: 'front_edges', label: 'Front Edges', priceDelta: 0 },
        { value: 'front_pockets', label: 'Front Pockets', priceDelta: 0 },
        { value: 'chest_pocket', label: 'Chest Pocket', priceDelta: 0 },
      ],
    },
    {
      key: 'pocket',
      label: 'Pocket',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 120,
      section: 'pockets',
      choices: [
        { value: 'welt', label: 'Welt', priceDelta: 0 },
        { value: 'welt_slant', label: 'Welt Slant', priceDelta: 0 },
        { value: 'flap_pockets', label: 'Flap Pockets', priceDelta: 10 },
        { value: 'patch_pockets', label: 'Patch Pockets', priceDelta: 10 },
        { value: 'flap_ticket_pockets', label: 'Flap + Ticket Pockets', priceDelta: 20 },
        { value: 'jetted', label: 'Jetted', priceDelta: 10 },
      ],
    },
    {
      key: 'bottom_shape',
      label: 'Bottom Shape',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 130,
      section: 'construction',
      choices: [
        { value: 'straight', label: 'Straight', priceDelta: 0 },
        { value: 'pointed', label: 'Pointed', priceDelta: 0 },
      ],
    },
    {
      key: 'back_fabric',
      label: 'Back Fabric',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 140,
      section: 'construction',
      choices: [
        { value: 'solid_lining', label: 'Solid Lining', priceDelta: 0 },
        { value: 'jacquard_lining', label: 'Jacquard Lining', priceDelta: 15 },
        { value: 'fabric_self_back', label: 'Fabric-Self Back', priceDelta: 20 },
      ],
    },
    {
      key: 'belted_back',
      label: 'Belted Back',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 150,
      section: 'construction',
      choices: [
        { value: 'false', label: 'No', priceDelta: 0 },
        { value: 'true', label: 'Yes', priceDelta: 10 },
      ],
    },
    {
      key: 'monogram',
      label: 'Monogram',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 160,
      section: 'personalisation',
      choices: [
        { value: 'false', label: 'False', priceDelta: 0 },
        { value: 'true', label: 'True', priceDelta: 20 },
      ],
    },
    {
      key: 'monogram_text_style',
      label: 'Monogram Text Style',
      type: 'radio',
      uiHint: 'buttons',
      required: false,
      sortOrder: 170,
      section: 'personalisation',
      dependsOn: {
        monogram: 'true',
      },
      choices: [
        { value: 'type_written', label: 'Type Written', priceDelta: 0 },
        { value: 'hand_written', label: 'Hand Written', priceDelta: 10 },
      ],
    },
    {
      key: 'monogram_letter_count',
      label: 'No. of Letters',
      type: 'radio',
      uiHint: 'buttons',
      required: false,
      sortOrder: 180,
      section: 'personalisation',
      dependsOn: {
        monogram: 'true',
      },
      choices: [
        { value: '3_10_letters', label: '3 - 10', priceDelta: 0 },
      ],
    },
    {
      key: 'monogram_position',
      label: 'Position',
      type: 'select',
      uiHint: 'dropdown',
      required: false,
      sortOrder: 190,
      section: 'personalisation',
      dependsOn: {
        monogram: 'true',
      },
      choices: [
        { value: '2_letters_upper_left_pocket', label: '2 Letters - Upper Left Pocket', priceDelta: 0 },
        { value: '3_10_letters_upper_left_pocket', label: '3 -10 Letters Upper Left Pocket', priceDelta: 0 },
        { value: '2_letters_on_melton', label: '2 Letters on Melton', priceDelta: 0 },
        { value: '3_10_letters_on_melton', label: '3 - 10 Letters on Melton', priceDelta: 0 },
        { value: '3_10_letters_upper_left_pocket_2_rows', label: '3 - 10 Letters - Upper Left Pocket - 2 Rows', priceDelta: 0 },
        { value: '3_10_letters_upper_left_pocket_3_rows', label: '3 - 10 Letters - Upper Left Pocket - 3 Rows', priceDelta: 0 },
      ],
    },
    {
      key: 'monogram_text_value',
      label: 'Monogram Text',
      type: 'text',
      uiHint: 'text',
      required: false,
      sortOrder: 200,
      section: 'personalisation',
      dependsOn: {
        monogram: 'true',
      },
      validation: {
        minLength: 3,
        maxLength: 10,
      },
    },
  ],
  pricingRules: {
    black_label: {
      baseRule: 'fabric_cost_by_consumption_plus_cmt_plus_surcharge_plus_margin',
      cmtEur: 83,
      styleSurchargeEurDefault: 5,
      marginCapAud: 175,
      inhouseFabricRule: 'fixed_pricing_plus_surcharge_plus_margin',
      logisticsEur: 100,
    },
    red_label: {
      baseRule: 'fabric_cost_by_consumption_plus_surcharge_plus_margin',
      marginCapAud: 125,
      styleSurchargeOverrides: {
        alphonso_midnight_shawl_5btn: 3,
        alphonso_midnight_shawl_6btn: 3,
        giacomo_shawl: 3,
        gian_francesco_shawl: 6,
        gian_luigi_ritz_formal: 3,
        gian_paolo_gala: 6,
        mono_palazzo_shawl: 6,
        roberto_luca_formal: 3,
      },
      logisticsEur: 100,
    },
    bespoke: {
      baseRule: 'fabric_price_plus_cmt',
      logisticsEur: 100,
    },
  },
};

export function isOptionVisible(
  option: MtmOption,
  selections: Record<string, string | string[] | undefined>,
): boolean {
  if (!option.dependsOn) return true;

  return Object.entries(option.dependsOn).every(([depKey, depValue]) => {
    const selected = selections[depKey];

    if (Array.isArray(depValue)) {
      if (Array.isArray(selected)) return selected.some((v) => depValue.includes(v));
      return typeof selected === 'string' ? depValue.includes(selected) : false;
    }

    if (Array.isArray(selected)) return selected.includes(depValue);
    return selected === depValue;
  });
}

export function getVisibleWaistcoatOptions(
  selections: Record<string, string | string[] | undefined>,
): MtmOption[] {
  return [...waistcoatOptionSet.options]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((option) => isOptionVisible(option, selections));
}

export function getWaistcoatProductionTier(styleValue?: string): ProductionTier | null {
  if (!styleValue) return null;
  const styleOption = waistcoatOptionSet.options.find((o) => o.key === 'style');
  const choice = styleOption?.choices?.find((c) => c.value === styleValue);
  return choice?.productionTier || null;
}

export function getWaistcoatStyleSurcharge(styleValue?: string): number {
  if (!styleValue) return 0;
  const styleOption = waistcoatOptionSet.options.find((o) => o.key === 'style');
  const choice = styleOption?.choices?.find((c) => c.value === styleValue);
  return choice?.priceDelta || 0;
}
