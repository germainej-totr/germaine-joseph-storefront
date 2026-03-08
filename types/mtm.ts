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

export interface GJFabric {
  fabricCode: string;
  mill: string;
  composition: string;
  weightGsm: number;
  priceTier: string;
}