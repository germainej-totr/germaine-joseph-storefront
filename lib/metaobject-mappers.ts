/**
 * lib/metaobject-mappers.ts
 *
 * Converts raw Shopify Admin API metaobject responses into typed domain objects.
 * All mappers are pure functions — they accept a MetaobjectRaw and return the
 * corresponding typed interface from types/mtm.ts.
 *
 * For reference fields (list.metaobject_reference), the raw value is a JSON
 * array of GIDs. Callers are responsible for resolving those GIDs to typed
 * objects before calling the higher-level mappers (mapToGJOption,
 * mapToGJOptionSet).
 */

import type {
  GJChoice,
  GJFabric,
  GJMeasurementGuide,
  GJOption,
  GJOptionSet,
  GJServiceType,
  MtmCategory,
} from '../types/mtm';

// ── Raw shape ─────────────────────────────────────────────────────────────────

export interface MetaobjectField {
  key: string;
  value: string | null;
}

export interface MetaobjectRaw {
  id: string;
  handle: string;
  type: string;
  fields: MetaobjectField[];
}

// ── Field helpers ─────────────────────────────────────────────────────────────

function f(fields: MetaobjectField[], key: string): string {
  return fields.find(x => x.key === key)?.value ?? '';
}

function fNum(fields: MetaobjectField[], key: string): number {
  return parseFloat(f(fields, key) || '0');
}

function fBool(fields: MetaobjectField[], key: string): boolean {
  return f(fields, key) === 'true';
}

function fJson<T>(fields: MetaobjectField[], key: string): T | undefined {
  const v = f(fields, key);
  return v ? (JSON.parse(v) as T) : undefined;
}

function fList(fields: MetaobjectField[], key: string): string[] {
  const v = f(fields, key);
  return v ? (JSON.parse(v) as string[]) : [];
}

// ── Mappers ───────────────────────────────────────────────────────────────────

export function mapToGJChoice(raw: MetaobjectRaw): GJChoice {
  const { fields, id, handle } = raw;
  const tags = fList(fields, 'tags');
  return {
    id,
    handle,
    value: f(fields, 'value'),
    label: f(fields, 'label'),
    priceDelta: fNum(fields, 'price_delta') || undefined,
    tags: tags.length ? tags : undefined,
  };
}

export function mapToGJFabric(raw: MetaobjectRaw): GJFabric {
  const { fields, id, handle } = raw;
  return {
    id,
    handle,
    fabricCode: f(fields, 'fabric_code'),
    mill: f(fields, 'mill'),
    composition: f(fields, 'composition'),
    weightGsm: fNum(fields, 'weight_gsm'),
    priceTier: f(fields, 'price_tier'),
    season: f(fields, 'season') || undefined,
    weave: f(fields, 'weave') || undefined,
    colour: f(fields, 'colour') || undefined,
    availabilityStatus: f(fields, 'availability_status') || undefined,
  };
}

export function mapToGJServiceType(raw: MetaobjectRaw): GJServiceType {
  const { fields, id, handle } = raw;
  return {
    id,
    handle,
    name: f(fields, 'name'),
    durationMin: fNum(fields, 'duration_min'),
    depositAmount: fNum(fields, 'deposit_amount'),
    leadTimeHours: fNum(fields, 'lead_time_hours'),
    travelRequired: fBool(fields, 'travel_required'),
    zones: fJson(fields, 'zones'),
  };
}

/**
 * Maps a gjm_option metaobject to GJOption.
 * Pass a pre-built Map<gid, GJChoice> to hydrate the choices array.
 * If omitted, choices will be an empty array.
 */
export function mapToGJOption(
  raw: MetaobjectRaw,
  resolvedChoices: Map<string, GJChoice> = new Map()
): GJOption {
  const { fields, id, handle } = raw;
  const choiceGids = fList(fields, 'choices');
  return {
    id,
    handle,
    key: f(fields, 'key'),
    label: f(fields, 'label'),
    type: (f(fields, 'type') || 'select') as GJOption['type'],
    choices: choiceGids
      .map(gid => resolvedChoices.get(gid))
      .filter((c): c is GJChoice => c !== undefined),
    uiHint: f(fields, 'ui_hint') || undefined,
    dependsOn: fJson(fields, 'depends_on'),
    validation: fJson(fields, 'validation'),
  };
}

/**
 * Maps a gjm_option_set metaobject to GJOptionSet.
 * Pass a pre-built Map<gid, GJOption> to hydrate the options array.
 * If omitted, options will be an empty array.
 */
export function mapToGJOptionSet(
  raw: MetaobjectRaw,
  resolvedOptions: Map<string, GJOption> = new Map()
): GJOptionSet {
  const { fields, id, handle } = raw;
  const optionGids = fList(fields, 'options');
  return {
    id,
    handle,
    title: f(fields, 'title'),
    category: f(fields, 'category') as MtmCategory,
    version: f(fields, 'version'),
    options: optionGids
      .map(gid => resolvedOptions.get(gid))
      .filter((o): o is GJOption => o !== undefined),
    defaultConfig: fJson(fields, 'default_config'),
    pricingRules: fJson(fields, 'pricing_rules'),
  };
}

export function mapToGJMeasurementGuide(raw: MetaobjectRaw): GJMeasurementGuide {
  const { fields, id, handle } = raw;
  return {
    id,
    handle,
    category: f(fields, 'category') as MtmCategory,
    fields: fJson(fields, 'fields') ?? [],
  };
}
