import { MtmCategory } from "./mtm";

export interface FitProfile {
  id: string;
  label: string;
  customerId?: string;
  email?: string;
  categoryDefaults?: Record<MtmCategory, any>;
}

export interface MeasurementSet {
  fitProfileId: string;
  category: MtmCategory;
  measurements: Record<string, number>;
  source: "smart_fit" | "manual" | "tailor_measured";
  version: number;
}

// API helpers
export interface FitProfileCreate {
  email?: string;
  label?: string;
  categoryDefaults?: Record<MtmCategory, any>;
}

export interface ProductSummary {
  id: string;
  handle: string;
  title: string;
  imageUrl?: string;
  mtmRequired?: boolean;
}

export interface ProductDetail extends ProductSummary {
  description?: string;
  metafields?: Record<string, any>;
}