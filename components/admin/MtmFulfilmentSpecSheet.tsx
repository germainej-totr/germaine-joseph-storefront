'use client';

/**
 * A20: MTM Fulfilment Spec Sheet
 *
 * Print-ready spec sheet component.  Uses @media print styles so it can
 * be sent to a printer or saved as PDF directly from the browser.
 * Also works as a screen-readable summary on the admin detail page.
 */

import type {
  MtmFulfilmentSpec,
  MtmProductionLineItem,
  MtmQualityGate,
  ProductionStage,
} from '@/lib/mtm/MtmFulfilmentSpecBuilder';

// ---------------------------------------------------------------------------
// Stage labels
// ---------------------------------------------------------------------------

const STAGE_LABELS: Record<ProductionStage, string> = {
  cutting: 'Cutting',
  construction: 'Construction',
  details: 'Details',
  finishing: 'Finishing',
  quality: 'Quality',
};

const PRIORITY_INDICATOR: Record<MtmProductionLineItem['priority'], string> = {
  critical: '●',
  standard: '○',
  cosmetic: '◌',
};

// ---------------------------------------------------------------------------
// Section primitives
// ---------------------------------------------------------------------------

function SheetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 print:mb-4 print:break-inside-avoid">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-1 mb-3 print:text-black">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SpecRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-x-4 py-1 border-b border-slate-50 last:border-0 print:border-slate-200 ${highlight ? 'bg-amber-50 print:bg-white' : ''}`}>
      <span className="w-44 shrink-0 text-xs text-slate-500 print:text-black">{label}</span>
      <span className={`text-sm font-medium text-slate-800 break-all print:text-black ${highlight ? 'font-bold' : ''}`}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Production lines grouped by stage
// ---------------------------------------------------------------------------

function ProductionStageGroup({
  stage,
  lines,
}: {
  stage: ProductionStage;
  lines: MtmProductionLineItem[];
}) {
  if (lines.length === 0) return null;

  return (
    <div className="mb-4 print:mb-3">
      <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 print:text-black">
        {STAGE_LABELS[stage]}
      </h4>
      <table className="w-full text-sm border-collapse">
        <tbody>
          {lines.map((line) => (
            <tr
              key={line.key}
              className="border-b border-slate-100 print:border-slate-200 hover:bg-slate-50"
            >
              <td className="py-1.5 pr-3 w-6 text-center text-slate-400 print:text-black">
                <span title={line.priority}>{PRIORITY_INDICATOR[line.priority]}</span>
              </td>
              <td className="py-1.5 pr-4 text-xs text-slate-500 print:text-black whitespace-nowrap">
                {line.label}
              </td>
              <td className="py-1.5 font-medium text-slate-800 print:text-black">{line.value}</td>
              <td className="py-1.5 pl-4 text-xs text-slate-400 print:text-black italic">
                {line.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductionLinesSection({ lines }: { lines: MtmProductionLineItem[] }) {
  const byStage = lines.reduce<Partial<Record<ProductionStage, MtmProductionLineItem[]>>>(
    (acc, line) => {
      if (!acc[line.stage]) acc[line.stage] = [];
      acc[line.stage]!.push(line);
      return acc;
    },
    {},
  );

  const stages: ProductionStage[] = ['cutting', 'construction', 'details', 'finishing'];

  return (
    <SheetSection title="Production Lines">
      <div className="text-xs text-slate-400 mb-3 flex gap-4 print:hidden">
        <span>● Critical</span>
        <span>○ Standard</span>
        <span>◌ Cosmetic</span>
      </div>
      {stages.map((stage) => (
        <ProductionStageGroup key={stage} stage={stage} lines={byStage[stage] ?? []} />
      ))}
    </SheetSection>
  );
}

// ---------------------------------------------------------------------------
// Quality gates
// ---------------------------------------------------------------------------

const CHECK_TYPE_BADGE: Record<MtmQualityGate['checkType'], string> = {
  measurement: 'Measure',
  visual: 'Visual',
  functional: 'Function',
};

const CHECK_TYPE_CLS: Record<MtmQualityGate['checkType'], string> = {
  measurement: 'bg-blue-50 text-blue-700',
  visual: 'bg-violet-50 text-violet-700',
  functional: 'bg-green-50 text-green-700',
};

function QualityGatesSection({ gates }: { gates: MtmQualityGate[] }) {
  return (
    <SheetSection title="Quality Gates">
      <ul className="space-y-2">
        {gates.map((gate) => (
          <li key={gate.key} className="flex items-start gap-3 print:break-inside-avoid">
            {/* Print checkbox */}
            <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-slate-300 print:border-slate-600 inline-block" />
            <div className="flex-1">
              <span
                className={`text-xs font-semibold rounded px-1.5 py-0.5 mr-2 print:border print:border-current ${CHECK_TYPE_CLS[gate.checkType]}`}
              >
                {CHECK_TYPE_BADGE[gate.checkType]}
              </span>
              <span className="text-sm text-slate-700 print:text-black">{gate.description}</span>
            </div>
          </li>
        ))}
      </ul>
    </SheetSection>
  );
}

// ---------------------------------------------------------------------------
// Pricing section
// ---------------------------------------------------------------------------

function PricingSection({ pricing }: { pricing: MtmFulfilmentSpec['pricing'] }) {
  if (!pricing) return null;

  return (
    <SheetSection title="Pricing">
      {pricing.breakdown?.map((item) => (
        <SpecRow
          key={item.key}
          label={item.label}
          value={`£${(item.amountPence / 100).toFixed(2)}`}
        />
      ))}
      {pricing.fabricUpchargePence != null && (
        <SpecRow label="Fabric upcharge" value={`£${(pricing.fabricUpchargePence / 100).toFixed(2)}`} />
      )}
      {pricing.totalPence != null && (
        <SpecRow label="Total" value={`£${(pricing.totalPence / 100).toFixed(2)}`} highlight />
      )}
    </SheetSection>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export interface MtmFulfilmentSpecSheetProps {
  spec: MtmFulfilmentSpec;
  /** Spec download URL — drives the "Download JSON" button */
  downloadUrl?: string;
}

export function MtmFulfilmentSpecSheet({ spec, downloadUrl }: MtmFulfilmentSpecSheetProps) {
  const { customer, garment, measurements, productionLines, qualityGates, pricing, meta } = spec;

  const printDate = new Date(spec.generatedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white text-slate-900">
      {/* ─── SCREEN-ONLY ACTION BAR ─── */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Fulfilment Specification
        </h3>
        <div className="flex gap-2">
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={`spec-${spec.orderId}.json`}
              className="text-xs border border-slate-200 rounded px-3 py-1.5 text-slate-600 hover:text-slate-900 transition-colors"
            >
              Download JSON
            </a>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs bg-[#826300] hover:bg-[#6b5200] text-white rounded px-3 py-1.5 font-medium transition-colors"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* ─── HEADER ─── */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-slate-900 print:border-slate-800">
        <div>
          <p className="text-2xl font-bold tracking-tight print:text-xl">
            Germaine Joseph — Fulfilment Specification
          </p>
          <p className="text-sm text-slate-500 mt-0.5 print:text-slate-700">
            {garment.category.toUpperCase()} · {spec.orderId} · Generated {printDate}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 print:text-slate-600 font-mono">
            Spec ID: {spec.specId}
          </p>
        </div>
        <div className="text-right print:block hidden-screen print:block">
          <p className="text-xs text-slate-500">Payload v{meta.payloadVersion}</p>
          {meta.fitGateVersion && (
            <p className="text-xs text-slate-400">Fit gate: {meta.fitGateVersion}</p>
          )}
        </div>
      </div>

      {/* ─── CUSTOMER ─── */}
      <SheetSection title="Customer">
        <SpecRow label="Email" value={customer.email} />
        <SpecRow label="Fit preference" value={customer.fitPreference ?? '—'} />
        <SpecRow label="Fit profile ID" value={customer.fitProfileId ?? '—'} />
        <SpecRow label="Booking ID" value={customer.bookingId ?? '—'} />
        <SpecRow
          label="Appointment"
          value={
            customer.appointmentDate
              ? `${customer.appointmentDate}${customer.appointmentTime ? ' at ' + customer.appointmentTime : ''}`
              : '—'
          }
        />
      </SheetSection>

      {/* ─── GARMENT ─── */}
      <SheetSection title="Garment">
        <SpecRow label="Category" value={garment.category.toUpperCase()} highlight />
        <SpecRow label="Option set" value={garment.optionSet ?? '—'} />
        <SpecRow label="Version" value={garment.optionSetVersion ?? '—'} />
        {garment.fabric && (
          <>
            <SpecRow label="Fabric" value={garment.fabric.name ?? garment.fabric.code} highlight />
            <SpecRow label="Article code" value={garment.fabric.code} />
            {garment.fabric.mill && <SpecRow label="Mill" value={garment.fabric.mill} />}
            {garment.fabric.composition && (
              <SpecRow label="Composition" value={garment.fabric.composition} />
            )}
            {garment.fabric.weightGm != null && (
              <SpecRow label="Weight" value={`${garment.fabric.weightGm} g/m²`} />
            )}
            {garment.fabric.careInstructions && (
              <SpecRow label="Care" value={garment.fabric.careInstructions} />
            )}
            {garment.fabric.isLimitedEdition && (
              <SpecRow label="Note" value="LIMITED EDITION — handle with care" />
            )}
          </>
        )}
      </SheetSection>

      {/* ─── MEASUREMENTS ─── */}
      {Object.keys(measurements.body).length > 0 && (
        <SheetSection title="Body Measurements">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 print:grid-cols-5">
            {Object.entries(measurements.body).map(([k, v]) => (
              <div key={k} className="bg-slate-50 print:border print:border-slate-200 rounded px-2 py-2">
                <p className="text-xs text-slate-500 print:text-slate-700 capitalize">
                  {k.replace(/_/g, ' ')}
                </p>
                <p className="text-sm font-bold text-slate-800 print:text-black">{v} cm</p>
              </div>
            ))}
          </div>
        </SheetSection>
      )}

      {/* ─── PRODUCTION NOTES ─── */}
      {spec.productionNotes && (
        <SheetSection title="Production Notes">
          <p className="text-sm text-slate-700 print:text-black whitespace-pre-wrap bg-amber-50 print:bg-white rounded p-3">
            {spec.productionNotes}
          </p>
        </SheetSection>
      )}

      {/* ─── PRODUCTION LINES ─── */}
      <ProductionLinesSection lines={productionLines} />

      {/* ─── QUALITY GATES ─── */}
      <QualityGatesSection gates={qualityGates} />

      {/* ─── PRICING ─── */}
      <PricingSection pricing={pricing} />

      {/* ─── FOOTER ─── */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 print:text-slate-600 flex justify-between print:block">
        <span>Generated by gjm-fulfilment-v1 · {printDate}</span>
        <span className="print:block print:mt-1">Internal use only — do not distribute</span>
      </div>
    </div>
  );
}
