'use client';

import Link from 'next/link';

import { useFitProfile } from '@/hooks/useFitProfile';
import type { FitProfile } from '@/types/fit';

type Props = {
  initialProfiles?: FitProfile[];
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 py-3 text-sm">
      <span className="font-medium text-zinc-500">{label}</span>
      <span className="text-right text-zinc-900">{value}</span>
    </div>
  );
}

export default function FitProfileSummaryCard({ initialProfiles = [] }: Props) {
  const { profile, isLoading, error } = useFitProfile({ initialProfiles, enabled: true });

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Fit profile</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-950">Current status</h2>
      </div>

      {isLoading && !profile ? (
        <p className="text-sm leading-6 text-zinc-600">Loading fit profile...</p>
      ) : error && !profile ? (
        <p className="text-sm leading-6 text-rose-600">Unable to load fit profile: {error}</p>
      ) : profile ? (
        <>
          <InfoRow label="Profile" value={profile.label || 'Saved profile'} />
          <InfoRow label="Jacket size" value={profile.categoryDefaults?.jacket?.size || 'Not set'} />
          <InfoRow label="Trouser size" value={profile.categoryDefaults?.trouser?.size || 'Not set'} />
          <InfoRow label="Preference" value={profile.fitPreference || 'Not set'} />
          <InfoRow label="Version" value={String(profile.version || 1)} />
          <InfoRow label="Updated" value={new Date(profile.updatedAt).toLocaleDateString()} />
          <InfoRow label="Status" value={profile.isActive ? 'Active' : 'Inactive'} />
        </>
      ) : (
        <p className="text-sm leading-6 text-zinc-600">
          No fit profile has been associated with this session yet. Start the fitting flow to create one and unlock saved-fit gating.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/configure-fit"
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
        >
          Update fitting
        </Link>
        <Link
          href="/p/mtm-trouser-test-build"
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
        >
          Return to MTM product
        </Link>
      </div>
    </section>
  );
}
