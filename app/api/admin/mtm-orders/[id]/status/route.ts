// app/api/admin/mtm-orders/[id]/status/route.ts
// PATCH /api/admin/mtm-orders/:id/status  — update ProductionSpec.status
// Also handles POST for the <form> fallback on the detail page.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ALLOWED_STATUSES = [
  'queued',
  'in_review',
  'approved',
  'sent_to_tailor',
  'completed',
  'cancelled',
] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

function isAllowedStatus(value: unknown): value is AllowedStatus {
  return ALLOWED_STATUSES.includes(value as AllowedStatus);
}

interface Context {
  params: Promise<{ id: string }>;
}

async function updateStatus(req: NextRequest, context: Context): Promise<NextResponse> {
  const { id } = await context.params;

  let status: unknown;

  // Support both JSON body (PATCH) and form data (POST)
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    status = body.status;
  } else {
    const form = await req.formData().catch(() => null);
    status = form?.get('status');
  }

  if (!isAllowedStatus(status)) {
    return NextResponse.json(
      { error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  const spec = await prisma.productionSpec.findUnique({ where: { id } });
  if (!spec) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.productionSpec.update({
    where: { id },
    data: { status },
  });

  // For form POSTs, redirect back to the detail page
  if (req.method === 'POST' && !contentType.includes('application/json')) {
    return NextResponse.redirect(new URL(`/admin/mtm-orders/${id}`, req.url));
  }

  return NextResponse.json({ id: updated.id, status: updated.status });
}

export { updateStatus as PATCH, updateStatus as POST };
