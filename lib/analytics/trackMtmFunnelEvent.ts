'use client';

import type { MtmFunnelEventName, MtmFunnelEventPayload } from '@/lib/analytics/mtmFunnelContract';

export async function trackMtmFunnelEvent(
  eventName: MtmFunnelEventName,
  payload: Omit<MtmFunnelEventPayload, 'event_name' | 'occurred_at'>,
): Promise<void> {
  const body: MtmFunnelEventPayload = {
    ...payload,
    event_name: eventName,
    occurred_at: new Date().toISOString(),
  };

  try {
    await fetch('/api/analytics/mtm-funnel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // Never block UX flow on analytics failures.
  }
}
