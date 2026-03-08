export type MtmCategory = "suit" | "shirt" | "trouser" | "overcoat" | "blazer" | "vest";

export interface GJOptionSet {
  id: string;
  handle: string;
  title: string;
  category: MtmCategory;
  version: string;
  options: GJOption[];
  defaultConfig?: Record<string, any>;
}

export interface GJOption {
  key: string;
  label: string;
  type: 'select' | 'toggle' | 'radio' | 'text';
  choices: GJChoice[];
}

export interface GJChoice {
  value: string;
  label: string;
  priceDelta?: number;
}

// immutable snapshot attached to cart line item
export interface MtmSpec {
  category: MtmCategory;
  fabricCode?: string;
  options: Record<string, any>;
  measurements: Record<string, number>;
  notes?: string;
}
export interface GJFabric {
  fabricCode: string;
  mill: string;
  composition: string;
  weightGsm: number;
  priceTier: string;
}