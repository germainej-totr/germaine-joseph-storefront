// app/admin/mtm-orders/page.tsx
// Server component — fetches all production specs and builds readiness rows.

import { prisma } from '@/lib/prisma';
import { withPrismaRetry } from '@/lib/prisma-retry';
import { buildOrderReviewSummary } from '@/lib/mtm/MtmOrderReviewSummary';
import { validateCanonicalPayload } from '@/lib/mtm/MtmCanonicalValidator';
import MtmOrdersClient, { type MtmOrderRow } from './MtmOrdersClient';

export const dynamic = 'force-dynamic';

export default async function MtmOrdersPage() {
  const specs = await withPrismaRetry(() =>
    prisma.productionSpec.findMany({
      orderBy: { createdAt: 'desc' },
      include: { fitProfile: true },
    }),
  );

  const rows: MtmOrderRow[] = specs.map((spec) => {
    // Attempt to parse the stored canonical payload
    const parsed = validateCanonicalPayload(spec.spec);

    let readiness: MtmOrderRow['readiness'] = 'blocked';
    let category = 'unknown';
    let customerEmail = spec.fitProfile?.email ?? 'unknown';

    if (parsed.ok && parsed.data) {
      const summary = buildOrderReviewSummary(spec.id, parsed.data);
      readiness = summary.readiness;
      category = summary.category;
      customerEmail = summary.fit.email;
    }

    return {
      id: spec.id,
      orderId: spec.orderId,
      category,
      customerEmail,
      status: spec.status,
      readiness,
      createdAt: spec.createdAt.toISOString(),
      fitProfileId: spec.fitProfileId,
    };
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <MtmOrdersClient initialOrders={rows} />
    </main>
  );
}
