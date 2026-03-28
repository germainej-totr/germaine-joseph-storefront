// app/api/admin/mtm-orders/[id]/spec/route.ts
// GET /api/admin/mtm-orders/:id/spec
//   Returns the structured fulfilment spec as a JSON download.
//   Optionally enriches the spec with a fabric record when fabricCode is
//   present in the payload.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateCanonicalPayload } from '@/lib/mtm/MtmCanonicalValidator';
import { buildFulfilmentSpec, serialiseFulfilmentSpec } from '@/lib/mtm/MtmFulfilmentSpecBuilder';
import { getFabricByArticleCode } from '@/lib/fabric/fabric-service';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: Context): Promise<NextResponse> {
  const { id } = await context.params;

  const spec = await prisma.productionSpec.findUnique({
    where: { id },
  });

  if (!spec) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const parsed = validateCanonicalPayload(spec.spec);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: 'Payload validation failed', details: parsed.errors },
      { status: 422 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const payload = parsed.data!;

  // Optional fabric enrichment
  const fabricCode = payload.mtmSpec?.fabricCode;
  const fabricRecord = fabricCode
    ? await getFabricByArticleCode(fabricCode).catch(() => null)
    : null;

  const fulfilmentSpec = buildFulfilmentSpec(spec.id, payload, {
    fabric: fabricRecord ?? undefined,
  });

  const json = serialiseFulfilmentSpec(fulfilmentSpec);
  const filename = `spec-${id}.json`;

  // Check if client wants inline JSON (e.g. Accept: application/json) or download
  const acceptHeader = req.headers.get('accept') ?? '';
  const asDownload = !acceptHeader.includes('application/json') || acceptHeader.includes('*/*');

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      ...(asDownload
        ? { 'Content-Disposition': `attachment; filename="${filename}"` }
        : {}),
      'Cache-Control': 'no-store',
    },
  });
}
