'use client';

import type {
  MtmGateEventName,
  MtmGateEventPayload,
} from '@/lib/analytics/mtmGateContract';

export async function trackMtmGateEvent(
  eventName: MtmGateEventName,
  payload: Omit<MtmGateEventPayload, 'event_name' | 'occurred_at'>,
): Promise<void> {
  const body: MtmGateEventPayload = {
    ...payload,
    event_name: eventName,
    occurred_at: new Date().toISOString(),
  };

  try {
    await fetch('/api/analytics/mtm-gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // Do not block checkout or fit flow on analytics failures.
  }
}
