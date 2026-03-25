'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { resolvePostFitDestination } from '@/lib/fit/flow';
import { trackFitFlowEvent } from '@/lib/analytics/trackFitFlowEvent';

const FIT_TYPE_LABELS: Record<string, string> = {
  drop_8: 'Slim Fit',
  drop_7: 'Regular Fit',
  drop_6: 'Classic Fit',
};

export default function ManualFitPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    trackFitFlowEvent({
      eventName: 'gjm_fit_flow_start',
      flowName: 'manual',
      email: searchParams.get('email') || undefined,
      productHandle: searchParams.get('productHandle') || undefined,
      variantId: searchParams.get('variantId') || undefined,
      source: 'fit_manual_ui',
    });
  }, [searchParams]);

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [label, setLabel] = useState(searchParams.get('profileName') || 'Manual Fit Profile');

  const [measurements, setMeasurements] = useState({
    chest: '',
    waist: '',
    hips: '',
    shoulders: '',
    sleeveLength: '',
    backLength: '',
    inseam: '',
    outseam: '',
    neck: '',
    bicep: '',
    thigh: '',
    calf: '',
  });

  const [preferences, setPreferences] = useState({
    fitType: 'drop_7',
    trouserRise: 'Mid-Rise',
    trouserBreak: 'Quarter Break',
    jacketLength: 'Standard',
  });

  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const canSave = useMemo(() => {
    return !!email && !!measurements.chest && !!measurements.waist && !!measurements.hips;
  }, [email, measurements.chest, measurements.waist, measurements.hips]);

  function computeSuggestedSizes() {
    const chest = Number(measurements.chest);
    const waist = Number(measurements.waist);

    if (!chest || !waist) {
      return { jacketSize: '', trouserSize: '' };
    }

    const normalizeToEvenUp = (value: number) => (value % 2 === 0 ? value : value + 1);
    const jacketSize = normalizeToEvenUp(Math.round(chest / 2));
    const trouserSize = normalizeToEvenUp(Math.round(waist / 2 + 5));

    return { jacketSize: String(jacketSize), trouserSize: String(trouserSize) };
  }

  async function saveManualProfile() {
    if (!canSave) {
      setError('Email, chest, waist, and hips are required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const suggested = computeSuggestedSizes();
      const response = await fetch('/api/fit/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          label,
          categoryDefaults: {
            jacket: { size: suggested.jacketSize || null },
            trouser: { size: suggested.trouserSize || null },
          },
          fitPreference: FIT_TYPE_LABELS[preferences.fitType] || 'Regular Fit',
          technicalSpecs: {
            source: 'manual_entry',
            measurements,
            preferences,
            notes,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save manual fit profile');
      }

      const destination = resolvePostFitDestination(searchParams, {
        email,
        defaultPath: '/fit/book',
      });

      trackFitFlowEvent({
        eventName: 'gjm_fit_flow_save_success',
        flowName: 'manual',
        email,
        fitProfileId: payload?.id,
        productHandle: searchParams.get('productHandle') || undefined,
        variantId: searchParams.get('variantId') || undefined,
        destination,
        source: 'fit_manual_ui',
      });

      window.location.href = destination;
    } catch (err) {
      trackFitFlowEvent({
        eventName: 'gjm_fit_flow_save_failure',
        flowName: 'manual',
        email,
        productHandle: searchParams.get('productHandle') || undefined,
        variantId: searchParams.get('variantId') || undefined,
        errorMessage: err instanceof Error ? err.message : 'unknown_error',
        source: 'fit_manual_ui',
      });
      setError(err instanceof Error ? err.message : 'Unable to save profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] px-4 py-10 text-black">
      <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-8 py-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Germaine Joseph</p>
          <h1 className="mt-1 text-3xl font-serif uppercase tracking-wider">Manual Measurements</h1>
          <p className="mt-2 text-sm text-zinc-500">For clients entering measurements from a tape-measure or existing tailor notes.</p>
        </div>

        <div className="space-y-6 px-8 py-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Profile Name</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Manual Intake"
                className="w-full rounded-md border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Body Measurements (cm)</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(measurements) as Array<keyof typeof measurements>).map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{key.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    type="number"
                    value={measurements[key]}
                    onChange={(e) => setMeasurements((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Fit Intent</label>
              <select
                value={preferences.fitType}
                onChange={(e) => setPreferences((prev) => ({ ...prev, fitType: e.target.value }))}
                className="w-full rounded-md border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              >
                <option value="drop_8">Slim (Drop 8)</option>
                <option value="drop_7">Regular (Drop 7)</option>
                <option value="drop_6">Classic (Drop 6)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Trouser Rise</label>
              <select
                value={preferences.trouserRise}
                onChange={(e) => setPreferences((prev) => ({ ...prev, trouserRise: e.target.value }))}
                className="w-full rounded-md border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              >
                <option>Low Rise</option>
                <option>Mid-Rise</option>
                <option>High Rise</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Trouser Break</label>
              <select
                value={preferences.trouserBreak}
                onChange={(e) => setPreferences((prev) => ({ ...prev, trouserBreak: e.target.value }))}
                className="w-full rounded-md border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              >
                <option>No Break</option>
                <option>Quarter Break</option>
                <option>Half Break</option>
                <option>Full Break</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Jacket Length</label>
              <select
                value={preferences.jacketLength}
                onChange={(e) => setPreferences((prev) => ({ ...prev, jacketLength: e.target.value }))}
                className="w-full rounded-md border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              >
                <option>Short</option>
                <option>Standard</option>
                <option>Long</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tailor Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Posture notes, asymmetry, balance adjustments, etc."
              className="min-h-[90px] w-full rounded-md border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <button
            type="button"
            onClick={saveManualProfile}
            disabled={!canSave || isSaving}
            className="w-full rounded-sm bg-black px-4 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Saving Manual Profile...' : 'Save Manual Profile & Book Fitting'}
          </button>
        </div>
      </div>
    </div>
  );
}