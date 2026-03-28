'use client';
import React, { useState, useMemo, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Ruler, ChevronRight, ChevronLeft, CheckCircle, Loader2 } from 'lucide-react';
import { resolvePostFitDestination } from '@/lib/fit/flow';
import { trackFitFlowEvent } from '@/lib/analytics/trackFitFlowEvent';
import { trackMtmFunnelEvent } from '@/lib/analytics/trackMtmFunnelEvent';

type BlockMeasurements = Record<string, number>;
type BlockSizeMap = Record<string, BlockMeasurements>;

// ─── Measurement block specs (source of truth: same as configure-fit) ────────
const measurementSpecs: Record<string, { jacket: BlockSizeMap; trouser: BlockSizeMap }> = {
  drop_8: {
    jacket: {
      '46': { back_length: 73.3, shoulders: 44.0, half_waist: 45.5 },
      '48': { back_length: 73.9, shoulders: 45.0, half_waist: 47.5 },
      '50': { back_length: 74.5, shoulders: 46.0, half_waist: 49.5 },
      '52': { back_length: 75.1, shoulders: 47.0, half_waist: 51.5 },
      '54': { back_length: 75.7, shoulders: 48.0, half_waist: 53.6 },
    },
    trouser: {
      '46': { half_waist: 41.0, rise: 17.8, hem: 18.4 },
      '48': { half_waist: 43.0, rise: 18.1, hem: 18.7 },
      '50': { half_waist: 45.0, rise: 18.5, hem: 19.0 },
      '52': { half_waist: 47.0, rise: 18.8, hem: 19.3 },
      '54': { half_waist: 49.0, rise: 19.5, hem: 19.6 },
    },
  },
  drop_7: {
    jacket: {
      '48': { back_length: 73.9, shoulders: 45.5, half_waist: 50.0 },
      '50': { back_length: 74.5, shoulders: 46.5, half_waist: 52.0 },
      '52': { back_length: 75.1, shoulders: 47.5, half_waist: 54.0 },
    },
    trouser: {
      '48': { half_waist: 43.0, rise: 19.1, hem: 20.7 },
      '50': { half_waist: 45.0, rise: 19.5, hem: 21.0 },
      '52': { half_waist: 47.0, rise: 19.8, hem: 21.3 },
    },
  },
  drop_6: {
    jacket: {
      '50': { back_length: 76.5, shoulders: 47.0, half_waist: 54.0 },
      '52': { back_length: 77.1, shoulders: 48.0, half_waist: 56.0 },
      '54': { back_length: 77.7, shoulders: 49.0, half_waist: 58.1 },
    },
    trouser: {
      '50': { half_waist: 45.0, rise: 22.5, hem: 22.0 },
      '52': { half_waist: 47.0, rise: 22.8, hem: 22.3 },
      '54': { half_waist: 49.0, rise: 23.5, hem: 22.6 },
    },
  },
};

// ─── Step labels ──────────────────────────────────────────────────────────────
const STEPS = ['Identity', 'Measurements', 'Body Details', 'Style Preferences', 'Review'];

function normalizeToEvenUp(n: number) {
  return n % 2 === 0 ? n : n + 1;
}

function resolveSize(requested: number, table: BlockSizeMap | undefined): number | null {
  const sizes = Object.keys(table ?? {})
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (!sizes.length) return null;
  return sizes.find((s) => s >= requested) ?? sizes[sizes.length - 1] ?? null;
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
function SmartFitWizardContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    trackFitFlowEvent({
      eventName: 'gjm_fit_flow_start',
      flowName: 'smart',
      email: searchParams.get('email') || undefined,
      productHandle: searchParams.get('productHandle') || undefined,
      variantId: searchParams.get('variantId') || undefined,
      source: 'fit_smart_ui',
    });

    trackMtmFunnelEvent('gjm_mtm_configurator_start', {
      product_handle: searchParams.get('productHandle') || undefined,
      mtm_category: 'mtm',
      variant_id: searchParams.get('variantId') || undefined,
      funnel_step: 'configurator_start',
      source: 'fit_smart_ui',
    });
  }, [searchParams]);

  // Step index: 0-based, maps to STEPS array.
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);

  // ── Step 1: Identity ──────────────────────────────────────────────────────
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [profileName, setProfileName] = useState(searchParams.get('profileName') ?? 'My Fit Profile');

  // ── Step 2: Measurements ─────────────────────────────────────────────────
  const [measurements, setMeasurements] = useState({
    chest: '',
    stomach: '',
    waist: '',
    hips: '',
    height: '',
    weight: '',
  });

  // ── Step 3: Body Details ─────────────────────────────────────────────────
  const [bodyDetails, setBodyDetails] = useState({
    shoulderSlope: '',
    standingPosture: '',
    chestProfile: '',
    stomachProfile: '',
    seatShape: '',
    bodyBuild: '',
    commonIssues: '',
    notes: '',
  });

  // ── Step 4: Style Preferences ────────────────────────────────────────────
  const [preferences, setPreferences] = useState({
    fitType: 'drop_8',
    trouserRise: 'Mid-Rise',
    trouserBreak: 'No Break',
    jacketLength: 'Standard',
    useCase: '',
  });

  // ── Computed fit profile (used on review step) ───────────────────────────
  const computed = useMemo(() => {
    const chest = Number(measurements.chest);
    const waist = Number(measurements.waist);
    if (!chest || !waist) return null;

    const jacketRequested = normalizeToEvenUp(Math.round(chest / 2));
    const trouserRequested = normalizeToEvenUp(Math.round(waist / 2 + 5));

    const jacketTable = measurementSpecs[preferences.fitType]?.jacket;
    const trouserTable = measurementSpecs[preferences.fitType]?.trouser;

    const jacketSize = resolveSize(jacketRequested, jacketTable);
    const trouserSize = resolveSize(trouserRequested, trouserTable);

    if (!jacketSize || !trouserSize) return null;

    return {
      jacketSize,
      trouserSize,
      jacketSpecs: jacketTable?.[jacketSize.toString()] ?? null,
      trouserSpecs: trouserTable?.[trouserSize.toString()] ?? null,
      label: preferences.fitType === 'drop_8' ? 'Slim Fit' : preferences.fitType === 'drop_7' ? 'Regular Fit' : 'Classic Fit',
      isMismatch: jacketSize !== trouserSize,
    };
  }, [measurements.chest, measurements.waist, preferences.fitType]);

  // ── Validation per step ──────────────────────────────────────────────────
  const canAdvance = useMemo(() => {
    if (step === 0) return email.includes('@') && profileName.trim().length > 0;
    if (step === 1) return !!(measurements.chest && measurements.stomach && measurements.waist && measurements.hips);
    if (step === 2) return true; // body details are optional
    if (step === 3) return !!preferences.fitType;
    return true;
  }, [step, email, profileName, measurements, preferences.fitType]);

  const advance = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!computed) {
      setSubmitError('Unable to compute fit profile. Please check your measurements.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const profilePayload = {
        email,
        label: profileName,
        categoryDefaults: {
          jacket: { size: computed.jacketSize.toString() },
          trouser: { size: computed.trouserSize.toString() },
        },
        fitPreference: computed.label,
        technicalSpecs: {
          attributes: {
            ...measurements,
            ...bodyDetails,
          },
          preferences,
          jacket: computed.jacketSpecs,
          trouser: computed.trouserSpecs,
          wizardVersion: 'smart_v1',
        },
      };

      const res = await fetch('/api/fit/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Profile save failed (${res.status}): ${text}`);
      }

      const responsePayload = (await res.json()) as { ok?: boolean; profile?: { id?: string } };
      const profile = responsePayload.profile;
      if (!profile?.id) {
        throw new Error('Fit profile response did not include an id');
      }
      document.cookie = `fit_profile_id=${profile.id}; path=/; max-age=31536000; SameSite=Lax`;
      setDone(true);

      const destination = resolvePostFitDestination(searchParams, {
        email,
        defaultPath: '/fit/book',
      });

      trackFitFlowEvent({
        eventName: 'gjm_fit_flow_save_success',
        flowName: 'smart',
        email,
        fitProfileId: profile?.id,
        productHandle: searchParams.get('productHandle') || undefined,
        variantId: searchParams.get('variantId') || undefined,
        destination,
        source: 'fit_smart_ui',
      });

      trackMtmFunnelEvent('gjm_mtm_fit_completion', {
        product_handle: searchParams.get('productHandle') || undefined,
        mtm_category: 'mtm',
        variant_id: searchParams.get('variantId') || undefined,
        fit_profile_id: profile?.id,
        funnel_step: 'fit_completion',
        source: 'fit_smart_ui',
      });

      // Short delay so the success state renders before navigating.
      setTimeout(() => { window.location.href = destination; }, 1200);
    } catch (err) {
      trackFitFlowEvent({
        eventName: 'gjm_fit_flow_save_failure',
        flowName: 'smart',
        email,
        productHandle: searchParams.get('productHandle') || undefined,
        variantId: searchParams.get('variantId') || undefined,
        errorMessage: err instanceof Error ? err.message : 'unknown_error',
        source: 'fit_smart_ui',
      });
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <CheckCircle size={48} className="text-green-600" />
        <h2 className="text-2xl font-serif uppercase tracking-widest">Profile Saved</h2>
        <p className="text-zinc-500 text-sm">Redirecting you now&hellip;</p>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center min-h-screen bg-[#FDFDFD] px-4 py-10 text-black font-sans">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-black px-8 py-7 text-center">
          <h1 className="text-white font-serif text-3xl tracking-[0.2em] uppercase">Germaine Joseph</h1>
          <p className="text-zinc-400 text-[10px] mt-1 uppercase tracking-widest">Bespoke Fit Profile</p>
        </div>

        {/* Progress bar */}
        <div className="flex">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 relative">
              <div className={`h-1 transition-colors ${i <= step ? 'bg-black' : 'bg-zinc-100'}`} />
              <p className={`text-center text-[8px] uppercase tracking-widest mt-1 font-bold transition-colors ${i === step ? 'text-black' : 'text-zinc-300'}`}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="px-8 py-10 space-y-8">
          {/* ── Step 0: Identity ── */}
          {step === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h2 className="text-xl font-serif uppercase tracking-widest">Your Profile</h2>
                <p className="text-zinc-400 text-xs mt-1">We&apos;ll use this to save your bespoke measurements.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full p-4 border-b bg-gray-50/50 outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Profile Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Wedding Suit 2025"
                  className="w-full p-4 border-b bg-gray-50/50 outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Primary Use Case (optional)</label>
                <select
                  value={preferences.useCase}
                  onChange={(e) => setPreferences({ ...preferences, useCase: e.target.value })}
                  className="w-full p-4 border-b bg-gray-50/50 outline-none text-sm"
                >
                  <option value="">Select&hellip;</option>
                  {['Business', 'Wedding', 'Event', 'Everyday', 'Other'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Step 1: Measurements ── */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h2 className="text-xl font-serif uppercase tracking-widest">Body Measurements</h2>
                <p className="text-zinc-400 text-xs mt-1">All values in centimetres, measured over a shirt.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {(
                  [
                    { key: 'chest', label: 'Chest *' },
                    { key: 'stomach', label: 'Stomach *' },
                    { key: 'waist', label: 'Waist *' },
                    { key: 'hips', label: 'Hips *' },
                    { key: 'height', label: 'Height' },
                    { key: 'weight', label: 'Weight (kg)' },
                  ] as { key: keyof typeof measurements; label: string }[]
                ).map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                      <Ruler size={10} />
                      {label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={measurements[key]}
                      onChange={(e) => setMeasurements({ ...measurements, [key]: e.target.value })}
                      className="w-full p-4 border-b bg-gray-50/50 outline-none text-sm"
                    />
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-zinc-400 italic">* Required fields to generate your digital tailor profile.</p>
            </div>
          )}

          {/* ── Step 2: Body Details ── */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h2 className="text-xl font-serif uppercase tracking-widest">Body Details</h2>
                <p className="text-zinc-400 text-xs mt-1">Help our tailors personalise your block. All optional.</p>
              </div>

              {(
                [
                  { key: 'bodyBuild', label: 'Body Build', options: ['Athletic', 'Slim', 'Regular', 'Fuller'] },
                  { key: 'standingPosture', label: 'Standing Posture', options: ['Upright', 'Slight Forward', 'Moderate Forward', 'Erect'] },
                  { key: 'shoulderSlope', label: 'Shoulder Slope', options: ['Flat', 'Slight Drop', 'Moderate Drop', 'Heavy Drop'] },
                  { key: 'chestProfile', label: 'Chest Profile', options: ['Flat', 'Slightly Full', 'Full', 'Very Full'] },
                  { key: 'stomachProfile', label: 'Stomach Profile', options: ['Flat', 'Slightly Curved', 'Curved', 'Prominent'] },
                  { key: 'seatShape', label: 'Seat Shape', options: ['Flat', 'Normal', 'High', 'Full'] },
                ] as { key: keyof typeof bodyDetails; label: string; options: string[] }[]
              ).map(({ key, label, options }) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setBodyDetails({ ...bodyDetails, [key]: opt })}
                        className={`py-3 text-xs tracking-wider border transition-colors ${
                          bodyDetails[key] === opt ? 'bg-black text-white border-black' : 'border-gray-200 text-zinc-500 hover:border-zinc-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Common Fit Issues</label>
                <textarea
                  placeholder="e.g. jacket pulls across shoulders, trousers gap at waist…"
                  value={bodyDetails.commonIssues}
                  onChange={(e) => setBodyDetails({ ...bodyDetails, commonIssues: e.target.value })}
                  className="w-full p-4 border bg-gray-50/50 outline-none text-sm rounded-md min-h-[80px]"
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Style Preferences ── */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h2 className="text-xl font-serif uppercase tracking-widest">Style Preferences</h2>
                <p className="text-zinc-400 text-xs mt-1">Define your silhouette and detailing intent.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Silhouette</label>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { value: 'drop_8', label: 'Slim', sub: 'Drop 8' },
                      { value: 'drop_7', label: 'Regular', sub: 'Drop 7' },
                      { value: 'drop_6', label: 'Classic', sub: 'Drop 6' },
                    ] as { value: string; label: string; sub: string }[]
                  ).map(({ value, label, sub }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, fitType: value })}
                      className={`py-5 flex flex-col items-center gap-1 border transition-colors ${
                        preferences.fitType === value ? 'bg-black text-white border-black' : 'border-gray-200 text-zinc-500 hover:border-zinc-400'
                      }`}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
                      <span className={`text-[9px] ${preferences.fitType === value ? 'text-zinc-300' : 'text-zinc-400'}`}>{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(
                [
                  {
                    key: 'trouserRise',
                    label: 'Trouser Rise',
                    options: ['Low Rise', 'Mid-Rise', 'High Rise'],
                  },
                  {
                    key: 'trouserBreak',
                    label: 'Trouser Break',
                    options: ['No Break', 'Quarter Break', 'Half Break', 'Full Break'],
                  },
                  {
                    key: 'jacketLength',
                    label: 'Jacket Length',
                    options: ['Short', 'Standard', 'Long'],
                  },
                ] as { key: keyof typeof preferences; label: string; options: string[] }[]
              ).map(({ key, label, options }) => (
                <div key={key} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</label>
                  <div className="flex flex-wrap gap-2">
                    {options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPreferences({ ...preferences, [key]: opt })}
                        className={`px-4 py-2 text-xs tracking-wider border transition-colors ${
                          preferences[key] === opt ? 'bg-black text-white border-black' : 'border-gray-200 text-zinc-500 hover:border-zinc-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Additional Notes</label>
                <textarea
                  placeholder="Any other stylistic preferences for our tailors…"
                  value={bodyDetails.notes}
                  onChange={(e) => setBodyDetails({ ...bodyDetails, notes: e.target.value })}
                  className="w-full p-4 border bg-gray-50/50 outline-none text-sm rounded-md min-h-[60px]"
                />
              </div>
            </div>
          )}

          {/* ── Step 4: Review ── */}
          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h2 className="text-xl font-serif uppercase tracking-widest">Review & Save</h2>
                <p className="text-zinc-400 text-xs mt-1">Confirm your profile before we compute your specification.</p>
              </div>

              {computed ? (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-8 text-center space-y-6">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 font-bold">MTM Specification</p>
                  <div className="flex justify-center items-baseline gap-12">
                    <div>
                      <p className="text-5xl font-serif">{computed.jacketSize}</p>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Jacket</p>
                    </div>
                    <div className="h-10 w-px bg-zinc-200" />
                    <div>
                      <p className="text-5xl font-serif">{computed.trouserSize}</p>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Trouser</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500">{computed.label}</p>
                  {computed.isMismatch && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      Jacket and trouser sizes differ — our tailors will note this and adjust accordingly.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
                  Unable to compute fit profile. Please go back and check your measurements (chest &amp; waist required).
                </div>
              )}

              <div className="rounded-xl border border-zinc-100 p-5 space-y-3 text-sm">
                <ReviewRow label="Email" value={email} />
                <ReviewRow label="Profile" value={profileName} />
                {preferences.useCase && <ReviewRow label="Use Case" value={preferences.useCase} />}
                <ReviewRow label="Silhouette" value={computed?.label ?? '—'} />
                <ReviewRow label="Trouser Rise" value={preferences.trouserRise} />
                <ReviewRow label="Trouser Break" value={preferences.trouserBreak} />
                <ReviewRow label="Jacket Length" value={preferences.jacketLength} />
              </div>

              {submitError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !computed}
                className="w-full bg-black text-white py-5 rounded-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving Profile&hellip;
                  </>
                ) : (
                  'Save & Unlock MTM'
                )}
              </button>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-1 text-xs uppercase tracking-widest text-zinc-400 hover:text-black disabled:opacity-0 transition-colors"
            >
              <ChevronLeft size={14} /> Back
            </button>

            {step < STEPS.length - 1 && (
              <button
                type="button"
                onClick={advance}
                disabled={!canAdvance}
                className="flex items-center gap-1 text-xs uppercase tracking-widest font-bold text-black hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {step === STEPS.length - 2 ? 'Review' : 'Continue'} <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">{label}</span>
      <span className="font-medium text-zinc-800">{value}</span>
    </div>
  );
}

export default function SmartFitPage() {
  return (
    <Suspense>
      <SmartFitWizardContent />
    </Suspense>
  );
}