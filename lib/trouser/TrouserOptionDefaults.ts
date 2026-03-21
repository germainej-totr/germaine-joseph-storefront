import { trouserOptionSet, type MtmOptionSet } from '@/types/trouserOptions';

export type TrouserSelections = Record<string, string | undefined>;

export const STYLE_DEFAULTS: Record<string, Partial<TrouserSelections>> = {
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
  corduroy_pants: {
    front_style: 'flat_front',
    waistband: 'belt_loops',
    fastening: 'hook_and_bar',
    fly: 'zipper',
  },
  drawstring: {
    front_style: 'flat_front',
    fly: 'zipper',
    front_pockets: 'on_seam_pockets',
    back_pockets: 'welt',
  },
  wide_leg_pants: {
    front_style: 'single_pleat',
    waistband: 'side_adjusters',
    fastening: 'hook_and_bar',
    fly: 'zipper',
    lining: 'front_half',
  },
};

export function getStyleDefaults(style?: string): Partial<TrouserSelections> {
  if (!style) return {};
  return STYLE_DEFAULTS[style] ?? {};
}

export function applyStyleDefaults(
  selections: TrouserSelections,
  optionSet: MtmOptionSet = trouserOptionSet,
): TrouserSelections {
  const style = selections.style;
  if (!style) return { ...selections };

  const defaults = getStyleDefaults(style);
  const next: TrouserSelections = { ...selections };

  // Only apply defaults that are valid values for the configured option choices.
  for (const [key, value] of Object.entries(defaults)) {
    if (!value || next[key]) continue;

    const option = optionSet.options.find((o) => o.key === key);
    const hasChoice = option?.choices?.some((c) => c.value === value);
    if (hasChoice) {
      next[key] = value;
    }
  }

  return next;
}
