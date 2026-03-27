import { MtmCategory } from "./mtm";

export interface FitProfile {
  id: string;
  label: string;
  customerId?: string;
  email?: string;
  categoryDefaults?: Record<MtmCategory, unknown>;
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
  categoryDefaults?: Record<MtmCategory, unknown>;
  appointmentDate?: string;
  appointmentTime?: string;
  fitPreference?: string;
  technicalSpecs?: Record<string, unknown>;
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
  metafields?: Record<string, unknown>;
}

/** Shape of gjm_fit.* customer metafields as read from Shopify */
/** Shape of gjm.* customer metafields as read from Shopify */
export interface GJFitGateMeta {
  height_cm?: number;
  weight_kg?: number;
  body_build?: string;
  fit_posture?: string;
  fit_shoulder_slope?: string;
  fit_preference?: string;
  primary_use_case?: string;
  event_date?: string;               // ISO date
  timeline_urgency?: string;
  preferred_fitting_mode?: string;
  consent_profile_storage?: boolean;
  fit_gate_version?: string;
  tailor_notes?: string;
  fit_issues?: string;
  trouser_break_preference?: string;
  trouser_rise_preference?: string;
  current_sizes_json?: Record<string, unknown>;
  jacket_length_preference?: string;
  fit_gate_completed_at?: string;    // ISO datetime
  fit_gate_status?: string;
}