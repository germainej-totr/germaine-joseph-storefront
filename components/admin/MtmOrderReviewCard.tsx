'use client';

/**
 * A19 / A20: MTM Order Review Card
 *
 * Full-page review view combining the design, fit, booking, and fabric
 * snapshots with the reviewer checklist, payload inspector, and
 * fulfilment spec sheet.
 * Used on the admin MTM order detail page.
 */

import { useState } from 'react';
import type { MtmOrderReviewSummary } from '@/lib/mtm/MtmOrderReviewSummary';
import { readinessLabel } from '@/lib/mtm/MtmOrderReviewSummary';
import { MtmReviewerChecklist } from './MtmReviewerChecklist';
import { MtmPayloadInspector } from './MtmPayloadInspector';
import type { MtmFulfilmentSpec } from '@/lib/mtm/MtmFulfilmentSpecBuilder';
import { MtmFulfilmentSpecSheet } from './MtmFulfilmentSpecSheet';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">{title}</h3>
      {children}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-wrap gap-x-4 py-1.5 border-b border-slate-50 last:border-0">
      <span className="w-40 shrink-0 text-xs text-slate-500">{label}</span>
      <span className="text-sm text-slate-800 font-medium break-all">
        {value ?? <span className="text-slate-400 italic font-normal">...</span>}
      </span>
    </div>
  );
}

function MoneyAmount({ pence }: { pence?: number }) {
  if (pence == null) return <span className="text-slate-400 italic">...</span>;
  return <span>GBP{(pence / 100).toFixed(2)}</span>;
}

function ReviewHeader({ summary }: { summary: MtmOrderReviewSummary }) {
  const { label, colour } = readinessLabel(summary.readiness);
  const badgeCls =
    colour === 'green' ? 'bg-green-100 text-green-800' :
    colour === 'amber' ? 'bg-amber-100 text-amber-800' :
    'bg-red-100 text-red-800';
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">MTM Order Review</p>
        <h2 className="text-xl font-bold text-slate-900 font-mono">{summary.orderId}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {summary.category.toUpperCase()} | payload {summary.version} | {new Date(summary.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${badgeCls}`}>{label}</span>
    </div>
  );
}

function DesignSection({ summary }: { summary: MtmOrderReviewSummary }) {
  const design = summary.design;
  if (!design) {
    return (
      <SectionCard title="Design Snapshot">
        <p className="text-sm text-amber-600 italic">No design snapshot available.</p>
      </SectionCard>
    );
  }
  return (
    <SectionCard title="Design Snapshot">
      <FieldRow label="Category" value={design.category} />
      <FieldRow label="Option set" value={design.optionSet} />
      <FieldRow label="Version" value={design.optionSetVersion} />
      <FieldRow label="Fabric code" value={design.fabricCode} />
      <FieldRow label="Total price" value={design.pricingTotal != null ? `GBP${(design.pricingTotal / 100).toFixed(2)}` : undefined} />
      <FieldRow label="Configuration valid" value={design.isValid ? 'Yes' : `No - ${design.validationErrors?.join(', ') ?? ''}`} />
      {Object.keys(design.selections).length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Selections</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(design.selections).map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded px-2 py-1.5">
                <p className="text-xs text-slate-500">{k}</p>
                <p className="text-sm font-medium text-slate-800 truncate">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {design.pricingBreakdown && design.pricingBreakdown.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Pricing breakdown</p>
          <ul className="text-sm divide-y divide-slate-100">
            {design.pricingBreakdown.map((item) => (
              <li key={item.key} className="flex justify-between py-1">
                <span className="text-slate-600">{item.label}</span>
                <MoneyAmount pence={item.amount} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}

function FitSection({ summary }: { summary: MtmOrderReviewSummary }) {
  const fit = summary.fit;
  return (
    <SectionCard title="Fit Profile">
      <FieldRow label="Customer email" value={fit.email} />
      <FieldRow label="Fit preference" value={fit.fitPreference} />
      <FieldRow label="Fit profile ID" value={fit.fitProfileId} />
      <FieldRow label="Booking ID" value={fit.bookingId} />
      <FieldRow label="Jacket size" value={fit.jacketSize} />
      <FieldRow label="Trouser size" value={fit.trouserSize} />
      <FieldRow label="Appointment date" value={fit.appointmentDate} />
      <FieldRow label="Appointment time" value={fit.appointmentTime} />
      {Object.keys(fit.measurements).length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Measurements</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(fit.measurements).map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded px-2 py-1.5">
                <p className="text-xs text-slate-500 capitalize">{k.replace('_', ' ')}</p>
                <p className="text-sm font-medium text-slate-800">{v} cm</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function SpecSection({ summary }: { summary: MtmOrderReviewSummary }) {
  const spec = summary.spec;
  return (
    <SectionCard title="MTM Specification">
      <FieldRow label="Category" value={spec.category} />
      <FieldRow label="Fabric code" value={spec.fabricCode} />
      <FieldRow label="Fit gate version" value={spec.fitGateVersion} />
      <FieldRow label="Notes" value={spec.notes} />
      {Object.keys(spec.options).length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Production options</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(spec.options).map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded px-2 py-1.5">
                <p className="text-xs text-slate-500">{k}</p>
                <p className="text-sm font-medium text-slate-800 truncate">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {Object.keys(spec.measurements).length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Final measurements</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(spec.measurements).map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded px-2 py-1.5">
                <p className="text-xs text-slate-500 capitalize">{k.replace('_', ' ')}</p>
                <p className="text-sm font-medium text-slate-800">{v} cm</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

type Tab = 'overview' | 'checklist' | 'inspector' | 'spec';

function TabBar({ active, onChange, hasSpec }: { active: Tab; onChange: (t: Tab) => void; hasSpec: boolean }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'checklist', label: 'Checklist' },
    { key: 'inspector', label: 'Inspector' },
    ...(hasSpec ? [{ key: 'spec' as Tab, label: 'Spec Sheet' }] : []),
  ];
  return (
    <div className="flex gap-1 mb-6 border-b border-slate-200">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${active === t.key ? 'border-[#826300] text-[#826300]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export interface MtmOrderReviewCardProps {
  summary: MtmOrderReviewSummary;
  fulfilmentSpec?: MtmFulfilmentSpec | null;
  specDownloadUrl?: string;
}

export function MtmOrderReviewCard({ summary, fulfilmentSpec, specDownloadUrl }: MtmOrderReviewCardProps) {
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <div>
      <ReviewHeader summary={summary} />
      <TabBar active={tab} onChange={setTab} hasSpec={!!fulfilmentSpec} />
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <DesignSection summary={summary} />
          <FitSection summary={summary} />
          <SpecSection summary={summary} />
        </div>
      )}
      {tab === 'checklist' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <MtmReviewerChecklist checklist={summary.checklist} readiness={summary.readiness} showAll />
        </div>
      )}
      {tab === 'inspector' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <MtmPayloadInspector payload={summary.rawPayload} />
        </div>
      )}
      {tab === 'spec' && fulfilmentSpec && (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <MtmFulfilmentSpecSheet spec={fulfilmentSpec} downloadUrl={specDownloadUrl} />
        </div>
      )}
    </div>
  );
}
