import type { MtmCategory } from '@/types/mtm';

function parseJsonRecord(raw?: string): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const output: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') output[key] = value;
    }
    return output;
  } catch {
    return {};
  }
}

export function deriveCategoryAnalyticsFields(
  categoryRaw: string,
  attributes: Record<string, string>,
): Record<string, string> {
  const category = (categoryRaw || '').toLowerCase() as MtmCategory | 'unknown';
  const optionSet = attributes.gjm_mtm_option_set || attributes.mtm_option_set || '';
  const optionSetVersion = attributes.gjm_mtm_option_set_version || attributes.mtm_option_set_version || '';
  const designUpcharge = attributes.gjm_design_pricing_total || attributes.gjm_trouser_pricing_total || '';
  const fabricId = attributes.gjm_fabric_id || '';

  const selections =
    parseJsonRecord(attributes[`gjm_${category}_selections`]) ||
    parseJsonRecord(attributes.gjm_mtm_options) ||
    parseJsonRecord(attributes.mtm_options);

  const base: Record<string, string> = {
    category,
    category_option_set: optionSet,
    category_option_set_version: optionSetVersion,
    category_design_upcharge: designUpcharge,
    category_fabric_id: fabricId,
  };

  if (category === 'suit') {
    return {
      ...base,
      suit_lapel_type: selections.lapel_type || '',
      suit_buttoning: selections.jacket_buttoning || selections.button_count || '',
      suit_fit: selections.jacket_fit || '',
      suit_variant: selections.satin_details ? 'tuxedo' : 'classic',
    };
  }

  if (category === 'blazer') {
    return {
      ...base,
      blazer_fit: selections.fit || '',
      blazer_lapel_type: selections.lapel_type || '',
      blazer_buttoning: selections.buttoning || '',
      blazer_pocket_style: selections.pocket_style || '',
    };
  }

  if (category === 'shirt') {
    return {
      ...base,
      shirt_fit: selections.fit || '',
      shirt_collar: selections.collar || '',
      shirt_cuff: selections.cuff || '',
      shirt_placket: selections.placket || '',
    };
  }

  if (category === 'overcoat') {
    return {
      ...base,
      overcoat_silhouette: selections.silhouette || '',
      overcoat_length: selections.length || '',
      overcoat_closure: selections.closure || '',
      overcoat_lapel: selections.lapel || '',
    };
  }

  if (category === 'vest') {
    return {
      ...base,
      waistcoat_fit: selections.fit || '',
      waistcoat_front_style: selections.front_style || '',
      waistcoat_neckline: selections.neckline || '',
      waistcoat_buttons: selections.buttons || '',
    };
  }

  return base;
}
