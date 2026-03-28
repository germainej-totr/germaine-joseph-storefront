import 'server-only';

import { capturePostHogEvent } from '@/lib/analytics/posthogServer';
import type { MtmFunnelEventPayload } from '@/lib/analytics/mtmFunnelContract';

function resolveDistinctId(payload: MtmFunnelEventPayload): string {
  return (
    payload.customer_id ||
    payload.fit_profile_id ||
    payload.booking_id ||
    payload.order_id ||
    `anon:${payload.mtm_category || payload.product_handle || 'mtm'}`
  );
}

export async function captureMtmFunnelEvent(payload: MtmFunnelEventPayload): Promise<void> {
  await capturePostHogEvent({
    event: payload.event_name,
    distinctId: resolveDistinctId(payload),
    timestamp: payload.occurred_at,
    properties: {
      ...payload,
      source: payload.source || 'gjm_mtm_funnel',
      ...(payload.properties || {}),
    },
  });
}
