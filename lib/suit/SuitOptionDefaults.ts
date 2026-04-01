import { allSuitOptionSets } from '@/types/suitOptions';
import type { MtmOptionSet } from '@/types/trouserOptions';
import type { SuitSelections } from '@/lib/suit/SuitOptionVisibility';

/**
 * Apply style-based defaults for a given suit variant.
 * Different suit types have different sensible defaults.
 */
export function applySuitStyleDefaults(
  selections: SuitSelections,
  optionSet: MtmOptionSet = allSuitOptionSets.business,
): SuitSelections {
  const defaults: SuitSelections = { ...selections };

  // Business suit defaults
  if (optionSet.id === 'suit-business-v1') {
    defaults.jacket_fit = defaults.jacket_fit ?? 'regular_fit';
    defaults.jacket_style = defaults.jacket_style ?? 'two_button';
    defaults.lapel_type = defaults.lapel_type ?? 'notch_lapel';
    defaults.lapel_width = defaults.lapel_width ?? 'standard';
    defaults.pocket_style = defaults.pocket_style ?? 'flap_pockets';
    defaults.button_count = defaults.button_count ?? 'two_button';
    defaults.lining = defaults.lining ?? 'half_lining';
    defaults.trouser_style = defaults.trouser_style ?? 'dress_pants';
    defaults.trouser_fit = defaults.trouser_fit ?? 'regular';
    defaults.button_finish = defaults.button_finish ?? 'standard_buttons';
  }

  // Wedding suit defaults
  if (optionSet.id === 'suit-wedding-v1') {
    defaults.jacket_fit = defaults.jacket_fit ?? 'regular_fit';
    defaults.jacket_style = defaults.jacket_style ?? 'two_button';
    defaults.lapel_type = defaults.lapel_type ?? 'peak_lapel';
    defaults.lapel_width = defaults.lapel_width ?? 'standard';
    defaults.pocket_style = defaults.pocket_style ?? 'welt_pockets';
    defaults.back_vent = defaults.back_vent ?? 'center_vent';
    defaults.lining = defaults.lining ?? 'full_lining';
    defaults.sleeve_style = defaults.sleeve_style ?? 'functional_cuff';
    defaults.trouser_style = defaults.trouser_style ?? 'dress_pants';
    defaults.trouser_fit = defaults.trouser_fit ?? 'regular';
    defaults.button_finish = defaults.button_finish ?? 'mother_of_pearl';
  }

  // Casual suit defaults
  if (optionSet.id === 'suit-casual-v1') {
    defaults.jacket_fit = defaults.jacket_fit ?? 'slim_fit';
    defaults.jacket_style = defaults.jacket_style ?? 'unstructured';
    defaults.lapel_type = defaults.lapel_type ?? 'notch_lapel';
    defaults.pocket_style = defaults.pocket_style ?? 'patch_pockets';
    defaults.button_count = defaults.button_count ?? 'single_breasted_two';
    defaults.sleeve_finish = defaults.sleeve_finish ?? 'standard';
    defaults.lining = defaults.lining ?? 'half_lining';
    defaults.trouser_style = defaults.trouser_style ?? 'chinos';
    defaults.trouser_fit = defaults.trouser_fit ?? 'regular';
    defaults.button_finish = defaults.button_finish ?? 'standard_buttons';
  }

  return defaults;
}
