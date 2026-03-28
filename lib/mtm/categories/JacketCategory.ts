import { registerCategoryMtmConfig } from '../CategoryMtmConfig';
import type { CategoryMtmConfig } from '../CategoryMtmConfig';
import { jacketOptionSet } from '@/types/jacketOptions';

/**
 * Register jacket category configuration
 */
const JACKET_CONFIG: CategoryMtmConfig = {
  category: 'jacket',
  displayName: 'Jackets',
  optionSet: jacketOptionSet,
  styleDefaults: {
    sport_coat: {
      button_count: 'two_button',
      lapel_width: 'standard',
      lapel_type: 'notch',
      pocket_style: 'flap_pockets',
      sleeve_style: 'standard',
      lining: 'full_lining',
      back_vents: 'single_vent',
      button_finish: 'standard_buttons',
    },
    blazer: {
      button_count: 'two_button',
      lapel_width: 'standard',
      lapel_type: 'notch',
      pocket_style: 'welt_pockets',
      sleeve_style: 'standard',
      lining: 'full_lining',
      back_vents: 'single_vent',
      button_finish: 'horn_buttons',
    },
    suit_jacket: {
      button_count: 'two_button',
      lapel_width: 'standard',
      lapel_type: 'notch',
      pocket_style: 'flap_pockets',
      sleeve_style: 'standard',
      lining: 'full_lining',
      back_vents: 'double_vents',
      button_finish: 'mother_of_pearl',
    },
    casual_jacket: {
      button_count: 'one_button',
      lapel_width: 'narrow',
      lapel_type: 'notch',
      pocket_style: 'patch_pockets',
      sleeve_style: 'standard',
      lining: 'half_lining',
      back_vents: 'single_vent',
      button_finish: 'standard_buttons',
    },
  },
  pricing: {
    basePriceEur: 250,
    optionUpcharges: {
      'lapel_type_peak': 30,
      'lapel_type_shawl': 50,
      'button_count_three_button': 20,
      'pocket_style_ticket_pocket': 25,
      'lining_full': 40,
      'button_finish_mother_of_pearl': 35,
    },
    styleUpcharges: {
      'sport_coat': 0,
      'blazer': 0,
      'suit_jacket': 20,
      'casual_jacket': 0,
    },
  },
  supportsSavedFit: true,
  customizationLevel: 'premium',
};

export function initializeJacketConfig(): void {
  registerCategoryMtmConfig(JACKET_CONFIG);
}
