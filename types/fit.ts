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