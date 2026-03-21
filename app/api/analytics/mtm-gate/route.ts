import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MTM_GATE_EVENT_NAMES } from '@/lib/analytics/mtmGateContract';

const MTM_GATE_EVENT_SCHEMA = z.object({
  product_handle: z.string(),
  product_type: z.string(),
  mtm_category: z.string(),
  variant_id: z.string(),
  customer_id: z.string().optional(),
  fit_profile_id: z.string().optional(),
  gate_decision: z.string().optional(),
  gate_reason: z.string().optional(),
  profile_age_days: z.number().optional(),
  event_name: z.enum(MTM_GATE_EVENT_NAMES),
  occurred_at: z.string(),
});

function getPostHogConfig() {
  return {
    host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
    apiKey: process.env.POSTHOG_API_KEY || '',
  };
}

function resolveDistinctId(payload: z.infer<typeof MTM_GATE_EVENT_SCHEMA>): string {
  return payload.customer_id || payload.fit_profile_id || `anon:${payload.product_handle}`;
}

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const payload = MTM_GATE_EVENT_SCHEMA.parse(rawPayload);
    const config = getPostHogConfig();

    if (!config.apiKey) {
      return NextResponse.json({ ok: false, error: 'posthog_not_configured' }, { status: 503 });
    }

    const captureResponse = await fetch(`${config.host}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: config.apiKey,
        event: payload.event_name,
        distinct_id: resolveDistinctId(payload),
        timestamp: payload.occurred_at,
        properties: {
          ...payload,
          source: 'gjm_mtm_gate',
        },
      }),
    });

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      return NextResponse.json(
        { ok: false, error: 'posthog_capture_failed', details: errorText },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'invalid_payload', issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
