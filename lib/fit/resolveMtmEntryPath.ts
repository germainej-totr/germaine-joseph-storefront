export type MtmEntryPath = 'full_mtm_required' | 'saved_fit_eligible' | 'refit_recommended';

export interface ResolveMtmEntryPathInput {
  hasAccount: boolean;
  hasFitProfile: boolean;
  fitProfileUpdatedAt?: string | Date | null;
  thresholdMonths?: number;
}

export interface MtmEntryDecision {
  entryPath: MtmEntryPath;
  profileAgeMonths: number | null;
  reason:
    | 'no_account'
    | 'no_fit_profile'
    | 'profile_fresh'
    | 'profile_stale'
    | 'profile_missing_timestamp'
    | 'unauthenticated'
    | 'profile_not_owned';
}

function monthsBetween(from: Date, to: Date): number {
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  const total = years * 12 + months;
  return Math.max(0, total);
}

function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveMtmEntryPath(input: ResolveMtmEntryPathInput): MtmEntryDecision {
  const thresholdMonths = input.thresholdMonths ?? 6;

  if (!input.hasAccount) {
    return {
      entryPath: 'full_mtm_required',
      profileAgeMonths: null,
      reason: 'no_account',
    };
  }

  if (!input.hasFitProfile) {
    return {
      entryPath: 'full_mtm_required',
      profileAgeMonths: null,
      reason: 'no_fit_profile',
    };
  }

  const profileDate = parseDate(input.fitProfileUpdatedAt);
  if (!profileDate) {
    return {
      entryPath: 'refit_recommended',
      profileAgeMonths: null,
      reason: 'profile_missing_timestamp',
    };
  }

  const ageMonths = monthsBetween(profileDate, new Date());

  if (ageMonths < thresholdMonths) {
    return {
      entryPath: 'saved_fit_eligible',
      profileAgeMonths: ageMonths,
      reason: 'profile_fresh',
    };
  }

  return {
    entryPath: 'refit_recommended',
    profileAgeMonths: ageMonths,
    reason: 'profile_stale',
  };
}
