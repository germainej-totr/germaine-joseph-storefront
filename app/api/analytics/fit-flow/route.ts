import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FIT_FLOW_EVENT_NAMES } from '@/lib/analytics/fitFlowContract';
import { capturePostHogEvent } from '@/lib/analytics/posthogServer';

const FIT_FLOW_EVENT_SCHEMA = z.object({
  event_name: z.enum(FIT_FLOW_EVENT_NAMES),
  occurred_at: z.string(),
  flow_name: z.enum(['smart', 'manual', 'configure']),
  email: z.string().email().optional(),
  fit_profile_id: z.string().optional(),
  product_handle: z.string().optional(),
  variant_id: z.string().optional(),
  destination: z.string().optional(),
  error_message: z.string().optional(),
  source: z.string().optional(),
});

function resolveDistinctId(payload: z.infer<typeof FIT_FLOW_EVENT_SCHEMA>): string {
  return payload.fit_profile_id || payload.email || `anon:${payload.flow_name}`;
}

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const payload = FIT_FLOW_EVENT_SCHEMA.parse(rawPayload);

    await capturePostHogEvent({
      event: payload.event_name,
      distinctId: resolveDistinctId(payload),
      timestamp: payload.occurred_at,
      properties: {
        ...payload,
        source: payload.source || 'gjm_fit_flow',
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'invalid_payload', issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
