/**
 * A20: MTM Production Summary
 *
 * Derives structured production line items and quality gates from
 * garment options + measurements. These are the artefacts that travel
 * to the workroom floor and tailor bench.
 *
 * Pure module — no side effects, no I/O.
 */

import type { MtmProductionLineItem, MtmQualityGate, ProductionStage } from './MtmFulfilmentSpecBuilder';

// ---------------------------------------------------------------------------
// Option → production stage mapping
// ---------------------------------------------------------------------------

/**
 * Maps a design/spec option key to its production stage and priority.
 * Unknown keys default to 'details / standard'.
 */
const OPTION_STAGE_MAP: Record<
  string,
  { stage: ProductionStage; priority: MtmProductionLineItem['priority']; notes?: string }
> = {
  // --- Cutting ---
  fabric: { stage: 'cutting', priority: 'critical', notes: 'Confirm grain direction before cutting' },
  fabric_code: { stage: 'cutting', priority: 'critical' },
  lining: { stage: 'cutting', priority: 'critical' },
  lining_colour: { stage: 'cutting', priority: 'critical' },
  interlining: { stage: 'cutting', priority: 'critical' },

  // --- Construction ---
  fit: { stage: 'construction', priority: 'critical' },
  fit_preference: { stage: 'construction', priority: 'critical' },
  waist: { stage: 'construction', priority: 'critical' },
  seat: { stage: 'construction', priority: 'critical' },
  thigh: { stage: 'construction', priority: 'critical' },
  rise: { stage: 'construction', priority: 'critical' },
  inseam: { stage: 'construction', priority: 'critical' },
  outseam: { stage: 'construction', priority: 'critical' },
  length: { stage: 'construction', priority: 'critical' },

  // --- Details ---
  pleat: { stage: 'details', priority: 'standard' },
  pleats: { stage: 'details', priority: 'standard' },
  cuff: { stage: 'details', priority: 'standard' },
  cuffs: { stage: 'details', priority: 'standard' },
  waistband: { stage: 'details', priority: 'standard' },
  side_adj: { stage: 'details', priority: 'standard' },
  side_adjusters: { stage: 'details', priority: 'standard' },
  belt_loops: { stage: 'details', priority: 'standard' },
  pockets: { stage: 'details', priority: 'standard' },
  pocket_style: { stage: 'details', priority: 'standard' },
  ticket_pocket: { stage: 'details', priority: 'cosmetic' },
  lapel: { stage: 'details', priority: 'standard' },
  lapel_style: { stage: 'details', priority: 'standard' },
  button_stance: { stage: 'details', priority: 'standard' },
  vent: { stage: 'details', priority: 'standard' },
  vents: { stage: 'details', priority: 'standard' },
  sleeve_buttons: { stage: 'details', priority: 'standard' },
  sleeve_button_style: { stage: 'details', priority: 'standard' },

  // --- Finishing ---
  buttons: { stage: 'finishing', priority: 'standard' },
  button_colour: { stage: 'finishing', priority: 'standard' },
  button_material: { stage: 'finishing', priority: 'standard' },
  monogram: { stage: 'finishing', priority: 'cosmetic', notes: 'Confirm text and thread colour with customer' },
  monogram_text: { stage: 'finishing', priority: 'cosmetic' },
  monogram_colour: { stage: 'finishing', priority: 'cosmetic' },
  contrast_stitching: { stage: 'finishing', priority: 'cosmetic' },
  collar: { stage: 'finishing', priority: 'standard' },
  collar_style: { stage: 'finishing', priority: 'standard' },
  trouser_finish: { stage: 'finishing', priority: 'standard' },
  hem: { stage: 'finishing', priority: 'standard' },
  hem_style: { stage: 'finishing', priority: 'standard' },
  brace_buttons: { stage: 'finishing', priority: 'cosmetic' },
};

function resolveStageAndPriority(key: string): {
  stage: ProductionStage;
  priority: MtmProductionLineItem['priority'];
  notes: string | undefined;
} {
  const normalised = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const mapping = OPTION_STAGE_MAP[normalised];
  if (mapping) return { stage: mapping.stage, priority: mapping.priority, notes: mapping.notes };

  // Heuristic fallbacks
  if (/len|waist|seat|thigh|rise|inseam|outseam|chest|sleeve|width|height/.test(normalised)) {
    return { stage: 'construction', priority: 'critical', notes: undefined };
  }
  if (/lining|interlin|fabric|cloth|material/.test(normalised)) {
    return { stage: 'cutting', priority: 'critical', notes: undefined };
  }
  if (/button|monogram|stitch|hem|finish|brace/.test(normalised)) {
    return { stage: 'finishing', priority: 'cosmetic', notes: undefined };
  }
  return { stage: 'details', priority: 'standard', notes: undefined };
}

function toLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Production lines
// ---------------------------------------------------------------------------

const STAGE_ORDER: ProductionStage[] = [
  'cutting',
  'construction',
  'details',
  'finishing',
  'quality',
];

/**
 * Build an ordered list of production line items from garment options
 * and body measurements.
 *
 * Measurements are always injected as 'construction/critical' lines;
 * design + spec options are mapped according to OPTION_STAGE_MAP.
 */
export function buildProductionLines(
  garment: {
    category: string;
    fabric: { code: string; name?: string; mill?: string; composition?: string } | null;
    options: Record<string, string>;
  },
  bodyMeasurements: Record<string, number>,
): MtmProductionLineItem[] {
  const lines: MtmProductionLineItem[] = [];

  // 1. Fabric — always the first cutting line
  if (garment.fabric) {
    const { code, name, mill, composition } = garment.fabric;
    lines.push({
      stage: 'cutting',
      key: 'fabric_ref',
      label: 'Fabric',
      value: [name ?? code, mill ? `(${mill})` : undefined].filter(Boolean).join(' '),
      notes: composition ? `Composition: ${composition}` : undefined,
      priority: 'critical',
    });
    lines.push({
      stage: 'cutting',
      key: 'fabric_code',
      label: 'Fabric Article Code',
      value: code,
      priority: 'critical',
    });
  } else if (garment.options.fabric ?? garment.options.fabric_code) {
    lines.push({
      stage: 'cutting',
      key: 'fabric_ref',
      label: 'Fabric',
      value: garment.options.fabric ?? garment.options.fabric_code ?? 'TBC',
      notes: 'No fabric record found — confirm with client before cutting',
      priority: 'critical',
    });
  }

  // 2. Body measurements → construction lines
  for (const [k, v] of Object.entries(bodyMeasurements)) {
    lines.push({
      stage: 'construction',
      key: `meas_${k}`,
      label: toLabel(k),
      value: `${v} cm`,
      priority: 'critical',
    });
  }

  // 3. Design / spec options
  const usedKeys = new Set(['fabric', 'fabric_code']);
  for (const [k, v] of Object.entries(garment.options)) {
    if (usedKeys.has(k)) continue;
    usedKeys.add(k);
    const { stage, priority, notes } = resolveStageAndPriority(k);
    lines.push({
      stage,
      key: k,
      label: toLabel(k),
      value: v,
      notes,
      priority,
    });
  }

  // Sort by stage order then by priority
  const priorityRank: Record<string, number> = { critical: 0, standard: 1, cosmetic: 2 };
  lines.sort((a, b) => {
    const stageDiff = STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage);
    if (stageDiff !== 0) return stageDiff;
    return (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1);
  });

  return lines;
}

// ---------------------------------------------------------------------------
// Quality gates
// ---------------------------------------------------------------------------

const COMMON_QUALITY_GATES: MtmQualityGate[] = [
  {
    key: 'fabric_correct',
    description: 'Confirm fabric article code matches purchase order before cutting.',
    checkType: 'visual',
  },
  {
    key: 'grain_direction',
    description: 'Verify fabric grain direction is correct on all cut pieces.',
    checkType: 'visual',
  },
  {
    key: 'measurements_transferred',
    description: 'All body measurements transferred to pattern; check against spec sheet.',
    checkType: 'measurement',
  },
];

const TROUSER_QUALITY_GATES: MtmQualityGate[] = [
  {
    key: 'waist_fit',
    description: 'Waist measurement: allow 1 cm ease for preferred fit, 2 cm for relaxed.',
    checkType: 'measurement',
  },
  {
    key: 'rise_check',
    description: 'Front and back rise verified against pattern.',
    checkType: 'measurement',
  },
  {
    key: 'hem_level',
    description: 'Hem level and style checked with customer at final fitting.',
    checkType: 'visual',
  },
  {
    key: 'pleat_symmetry',
    description: 'Pleats (if any) are symmetrical and evenly spaced.',
    checkType: 'visual',
  },
  {
    key: 'pockets_functional',
    description: 'All pockets open freely and lie flat.',
    checkType: 'functional',
  },
];

const JACKET_QUALITY_GATES: MtmQualityGate[] = [
  {
    key: 'shoulder_line',
    description: 'Shoulder line sits at correct pitch — no forward or backward roll.',
    checkType: 'visual',
  },
  {
    key: 'chest_ease',
    description: 'Chest ease correct for stated fit preference.',
    checkType: 'measurement',
  },
  {
    key: 'lapel_roll',
    description: 'Lapel roll smooth and consistent length.',
    checkType: 'visual',
  },
  {
    key: 'sleeve_length',
    description: 'Sleeve length shows correct shirt cuff reveal (1.5–2 cm).',
    checkType: 'visual',
  },
  {
    key: 'vents_flat',
    description: 'Back vents hang flat and do not splay open.',
    checkType: 'visual',
  },
  {
    key: 'button_stance',
    description: 'Button stance correct for body proportions.',
    checkType: 'visual',
  },
];

const CATEGORY_GATES: Record<string, MtmQualityGate[]> = {
  trouser: TROUSER_QUALITY_GATES,
  jacket: JACKET_QUALITY_GATES,
  suit: [...JACKET_QUALITY_GATES, ...TROUSER_QUALITY_GATES],
  blazer: JACKET_QUALITY_GATES,
  overcoat: JACKET_QUALITY_GATES,
  vest: [
    {
      key: 'armhole_fit',
      description: 'Armhole diameter comfortable without restricting movement.',
      checkType: 'functional',
    },
  ],
};

/**
 * Build the quality gate checklist for a given garment category.
 */
export function buildQualityGates(
  category: string,
  _bodyMeasurements: Record<string, number>,
): MtmQualityGate[] {
  const categoryGates = CATEGORY_GATES[category] ?? [];
  const allGates = [...COMMON_QUALITY_GATES, ...categoryGates];

  // Deduplicate by key
  const seen = new Set<string>();
  return allGates.filter((g) => {
    if (seen.has(g.key)) return false;
    seen.add(g.key);
    return true;
  });
}
