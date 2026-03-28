import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MTM_FUNNEL_EVENT_NAMES } from '@/lib/analytics/mtmFunnelContract';
import { captureMtmFunnelEvent } from '@/lib/analytics/captureMtmFunnelEvent';

const MTM_FUNNEL_EVENT_SCHEMA = z.object({
  event_name: z.enum(MTM_FUNNEL_EVENT_NAMES),
  occurred_at: z.string(),
  product_handle: z.string().optional(),
  product_type: z.string().optional(),
  mtm_category: z.string().optional(),
  variant_id: z.string().optional(),
  customer_id: z.string().optional(),
  fit_profile_id: z.string().optional(),
  booking_id: z.string().optional(),
  order_id: z.string().optional(),
  service_type: z.string().optional(),
  entry_path: z.enum(['saved_fit', 'full_mtm', 'refit']).optional(),
  option_name: z.string().optional(),
  option_value: z.string().optional(),
  funnel_step: z.string().optional(),
  source: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const payload = MTM_FUNNEL_EVENT_SCHEMA.parse(rawPayload);

    await captureMtmFunnelEvent(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'invalid_payload', issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
