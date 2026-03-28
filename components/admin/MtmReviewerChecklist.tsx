'use client';

/**
 * A19: Reviewer Checklist
 *
 * Renders the ordered list of readiness checks derived from buildOrderReviewSummary().
 * Each item shows pass/fail state, severity, and an optional detail hint.
 */

import type { ReviewCheckItem, ReviewReadinessStatus } from '@/lib/mtm/MtmOrderReviewSummary';
import { readinessLabel } from '@/lib/mtm/MtmOrderReviewSummary';

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

function ReadinessBadge({ status }: { status: ReviewReadinessStatus }) {
  const { label, colour } = readinessLabel(status);
  const cls =
    colour === 'green'
      ? 'bg-green-100 text-green-800 border-green-300'
      : colour === 'amber'
        ? 'bg-amber-100 text-amber-800 border-amber-300'
        : 'bg-red-100 text-red-800 border-red-300';

  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Individual check row
// ---------------------------------------------------------------------------

function CheckRow({ item }: { item: ReviewCheckItem }) {
  const icon = item.passed ? (
    <span className="text-green-600 font-bold" aria-hidden>✓</span>
  ) : item.severity === 'error' ? (
    <span className="text-red-600 font-bold" aria-hidden>✗</span>
  ) : item.severity === 'warning' ? (
    <span className="text-amber-500 font-bold" aria-hidden>!</span>
  ) : (
    <span className="text-slate-400" aria-hidden>–</span>
  );

  const labelColour = item.passed
    ? 'text-slate-700'
    : item.severity === 'error'
      ? 'text-red-700 font-semibold'
      : item.severity === 'warning'
        ? 'text-amber-700'
        : 'text-slate-500';

  return (
    <li className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="mt-0.5 w-5 text-center shrink-0 text-sm">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${labelColour}`}>{item.label}</p>
        {item.detail && (
          <p className="text-xs text-slate-500 mt-0.5 break-words">{item.detail}</p>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export interface MtmReviewerChecklistProps {
  checklist: ReviewCheckItem[];
  readiness: ReviewReadinessStatus;
  /** Whether to collapse failed-only items vs show all */
  showAll?: boolean;
}

export function MtmReviewerChecklist({
  checklist,
  readiness,
  showAll = true,
}: MtmReviewerChecklistProps) {
  const passCount = checklist.filter((c) => c.passed).length;
  const total = checklist.length;

  return (
    <section aria-label="Order readiness checklist">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Readiness Checklist
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {passCount}/{total} passed
          </span>
          <ReadinessBadge status={readiness} />
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {checklist
          .filter((c) => showAll || !c.passed)
          .map((item) => (
            <CheckRow key={item.key} item={item} />
          ))}
      </ul>
    </section>
  );
}
