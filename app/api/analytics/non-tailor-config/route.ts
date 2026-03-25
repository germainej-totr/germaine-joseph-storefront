import { NextResponse } from 'next/server';
import { z } from 'zod';
import { NON_TAILOR_CONFIGURATOR_EVENT_NAMES } from '@/lib/analytics/nonTailorConfiguratorContract';
import { capturePostHogEvent } from '@/lib/analytics/posthogServer';

const NON_TAILOR_CONFIG_EVENT_SCHEMA = z.object({
  event_name: z.enum(NON_TAILOR_CONFIGURATOR_EVENT_NAMES),
  occurred_at: z.string(),
  product_handle: z.string(),
  product_type: z.string(),
  mtm_category: z.string(),
  variant_id: z.string().optional(),
  fit_profile_id: z.string().optional(),
  option_name: z.string().optional(),
  option_value: z.string().optional(),
  selected_options_count: z.number().optional(),
  custom_notes_present: z.boolean().optional(),
  source: z.string().optional(),
});

function resolveDistinctId(payload: z.infer<typeof NON_TAILOR_CONFIG_EVENT_SCHEMA>): string {
  return payload.fit_profile_id || `anon:${payload.product_handle}`;
}

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const payload = NON_TAILOR_CONFIG_EVENT_SCHEMA.parse(rawPayload);

    await capturePostHogEvent({
      event: payload.event_name,
      distinctId: resolveDistinctId(payload),
      timestamp: payload.occurred_at,
      properties: {
        ...payload,
        source: payload.source || 'gjm_non_tailor_configurator',
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