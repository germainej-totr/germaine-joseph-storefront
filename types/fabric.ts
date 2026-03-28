import type { MtmCategory } from './mtm';

// ---------------------------------------------------------------------------
// Filter dimension types
// ---------------------------------------------------------------------------

export type FabricSeason = 'all_season' | 'spring_summer' | 'autumn_winter';

export type FabricColourFamily =
  | 'navy'
  | 'grey'
  | 'charcoal'
  | 'brown'
  | 'beige'
  | 'black'
  | 'blue'
  | 'green'
  | 'other';

export type FabricPattern =
  | 'plain'
  | 'stripe'
  | 'check'
  | 'windowpane'
  | 'herringbone'
  | 'houndstooth'
  | 'texture'
  | 'other';

// ---------------------------------------------------------------------------
// Core fabric record
// ---------------------------------------------------------------------------

export interface Fabric {
  id: string;
  name: string;
  description?: string;
  mill: string;
  season: FabricSeason;
  composition: string;
  colourFamily: FabricColourFamily;
  pattern: FabricPattern;
  /** grams per linear metre */
  weightGm?: number;
  articleCode?: string;
  /** retail upcharge in pence/cents */
  upchargePence: number;
  swatchImageUrl?: string;
  drapeImageUrl?: string;
  /** garment categories this fabric suits */
  suitableFor: MtmCategory[];
  careInstructions?: string;
  isActive: boolean;
  isLimitedEdition: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Selector filter state
// ---------------------------------------------------------------------------

export interface FabricFilters {
  mill?: string;
  season?: FabricSeason;
  colourFamily?: FabricColourFamily;
  pattern?: FabricPattern;
  /** min weight g/m */
  minWeightGm?: number;
  /** max weight g/m */
  maxWeightGm?: number;
  /** only show fabrics suitable for this category */
  category?: MtmCategory;
  searchQuery?: string;
}

// ---------------------------------------------------------------------------
// Display constants — used by the UI and filter dropdowns
// ---------------------------------------------------------------------------

export const FABRIC_SEASON_LABELS: Record<FabricSeason, string> = {
  all_season: 'All Season',
  spring_summer: 'Spring / Summer',
  autumn_winter: 'Autumn / Winter',
};

export const FABRIC_COLOUR_FAMILY_LABELS: Record<FabricColourFamily, string> = {
  navy: 'Navy',
  grey: 'Grey',
  charcoal: 'Charcoal',
  brown: 'Brown',
  beige: 'Beige / Stone',
  black: 'Black',
  blue: 'Blue',
  green: 'Green',
  other: 'Other',
};

export const FABRIC_PATTERN_LABELS: Record<FabricPattern, string> = {
  plain: 'Plain',
  stripe: 'Stripe',
  check: 'Check',
  windowpane: 'Windowpane',
  herringbone: 'Herringbone',
  houndstooth: 'Houndstooth',
  texture: 'Texture / Weave',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// CSV import row shape (A16 ingestion pipeline)
// ---------------------------------------------------------------------------

export interface FabricCsvRow {
  name: string;
  description?: string;
  mill: string;
  season: string;
  composition: string;
  colour_family: string;
  pattern: string;
  weight_gm?: string;
  article_code?: string;
  upcharge_pence?: string;
  swatch_image_url?: string;
  drape_image_url?: string;
  suitable_for: string; // comma-separated
  care_instructions?: string;
  is_limited_edition?: string;
}
