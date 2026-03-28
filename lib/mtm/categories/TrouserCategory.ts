import { registerCategoryMtmConfig } from '../CategoryMtmConfig';
import type { CategoryMtmConfig } from '../CategoryMtmConfig';
import { trouserOptionSet } from '@/types/trouserOptions';

/**
 * Register trouser category configuration
 */
const TROUSER_CONFIG: CategoryMtmConfig = {
  category: 'trouser',
  displayName: 'Trousers',
  optionSet: trouserOptionSet,
  styleDefaults: {
    dress_pants: {
      front_style: 'flat_front',
      waistband: 'belt_loops',
      fastening: 'hook_and_bar',
      fly: 'zipper',
      back_pockets: 'welt',
      tuxedo_contrast: 'none',
    },
    chinos: {
      front_style: 'flat_front',
      waistband: 'belt_loops',
      fastening: 'hook_and_bar',
      fly: 'zipper',
      back_pockets: 'welt',
    },
    linen_pants: {
      front_style: 'flat_front',
      waistband: 'belt_loops',
      fastening: 'hook_and_bar',
      fly: 'zipper',
      lining: 'front_half',
      back_pockets: 'welt',
    },
    jeans: {
      fly: 'zipper',
      front_pockets: 'western_pockets',
      back_pockets: 'patch_pockets',
      hem_style: 'plain_hem',
    },
  },
  pricing: {
    basePriceEur: 120,
    optionUpcharges: {
      'fabric_wool': 20,
      'fabric_linen': 15,
      'lining_full': 25,
      'back_pockets_patch': 15,
    },
    styleUpcharges: {
      'dress_pants': 0,
      'chinos': 10,
      'linen_pants': 20,
      'jeans': 15,
    },
  },
  supportsSavedFit: true,
  customizationLevel: 'premium',
};

export function initializeTrouserConfig(): void {
  registerCategoryMtmConfig(TROUSER_CONFIG);
}
