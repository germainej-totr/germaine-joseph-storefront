import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AUTH_EVENT_NAMES } from '@/lib/analytics/authContract';
import { capturePostHogEvent } from '@/lib/analytics/posthogServer';

const AUTH_EVENT_SCHEMA = z.object({
  event_name: z.enum(AUTH_EVENT_NAMES),
  occurred_at: z.string().optional(),
  distinct_id: z.string().optional(),
  email: z.string().email().optional(),
  method: z.string().optional(),
  oauth_status: z.string().optional(),
  oauth_error: z.string().optional(),
  error_message: z.string().optional(),
  source: z.string().optional(),
});

function resolveDistinctId(payload: z.infer<typeof AUTH_EVENT_SCHEMA>): string {
  return payload.distinct_id || payload.email || 'anon:auth';
}

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const payload = AUTH_EVENT_SCHEMA.parse(rawPayload);

    await capturePostHogEvent({
      event: payload.event_name,
      distinctId: resolveDistinctId(payload),
      timestamp: payload.occurred_at || new Date().toISOString(),
      properties: {
        ...payload,
        source: payload.source || 'gjm_auth',
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
