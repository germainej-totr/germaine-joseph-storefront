// app/admin/mtm-orders/[id]/page.tsx
// Server component — loads single ProductionSpec and renders the full review card.

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { withPrismaRetry } from '@/lib/prisma-retry';
import { buildOrderReviewSummary } from '@/lib/mtm/MtmOrderReviewSummary';
import { validateCanonicalPayload } from '@/lib/mtm/MtmCanonicalValidator';
import { MtmOrderReviewCard } from '@/components/admin/MtmOrderReviewCard';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MtmOrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  const spec = await withPrismaRetry(() =>
    prisma.productionSpec.findUnique({
      where: { id },
      include: { fitProfile: true },
    }),
  );

  if (!spec) notFound();

  const parsed = validateCanonicalPayload(spec.spec);

  // If we cannot parse the payload at all, show a raw error page
  if (!parsed.ok) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/admin/mtm-orders"
          className="text-sm text-[#826300] hover:underline mb-6 inline-block"
        >
          ← Back to MTM Orders
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-red-800 mb-2">Payload parse failed</h2>
          <p className="text-sm text-red-700 mb-4">
            The stored payload for order <code className="font-mono">{id}</code> could not be
            validated against the canonical schema.
          </p>
          <pre className="text-xs bg-white border border-red-100 rounded p-3 overflow-x-auto">
            {JSON.stringify(parsed.errors ?? parsed.error, null, 2)}
          </pre>
          <details className="mt-4">
            <summary className="text-xs text-red-600 cursor-pointer">Raw stored data</summary>
            <pre className="text-xs mt-2 bg-white border border-red-100 rounded p-3 overflow-x-auto">
              {JSON.stringify(spec.spec, null, 2)}
            </pre>
          </details>
        </div>
      </main>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const summary = buildOrderReviewSummary(spec.id, parsed.data!);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/admin/mtm-orders"
        className="text-sm text-[#826300] hover:underline mb-6 inline-block"
      >
        ← Back to MTM Orders
      </Link>

      {/* Status workflow strip */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-5 py-3 mb-6">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">Status:</span>
          <span className="font-semibold text-slate-800 capitalize">{spec.status.replace('_', ' ')}</span>
        </div>
        <div className="flex gap-2">
          <StatusAction specId={spec.id} currentStatus={spec.status} />
        </div>
      </div>

      <MtmOrderReviewCard summary={summary} />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Status action buttons (server-rendered form)
// ---------------------------------------------------------------------------

function StatusAction({ specId, currentStatus }: { specId: string; currentStatus: string }) {
  // Determine next logical status transition
  const transitions: Record<string, { next: string; label: string }> = {
    queued: { next: 'in_review', label: 'Begin Review' },
    in_review: { next: 'approved', label: 'Approve' },
    approved: { next: 'sent_to_tailor', label: 'Send to Tailor' },
  };

  const transition = transitions[currentStatus];
  if (!transition) return null;

  return (
    <form action={`/api/admin/mtm-orders/${specId}/status`} method="POST">
      <input type="hidden" name="status" value={transition.next} />
      <button
        type="submit"
        className="bg-[#826300] hover:bg-[#6b5200] text-white text-sm font-medium px-4 py-2 rounded transition-colors"
      >
        {transition.label}
      </button>
    </form>
  );
}
