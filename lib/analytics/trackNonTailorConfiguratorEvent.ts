'use client';

import type {
  NonTailorConfiguratorEventName,
  NonTailorConfiguratorEventPayload,
} from '@/lib/analytics/nonTailorConfiguratorContract';

export async function trackNonTailorConfiguratorEvent(
  eventName: NonTailorConfiguratorEventName,
  payload: Omit<NonTailorConfiguratorEventPayload, 'event_name' | 'occurred_at'>,
): Promise<void> {
  const body: NonTailorConfiguratorEventPayload = {
    ...payload,
    event_name: eventName,
    occurred_at: new Date().toISOString(),
  };

  try {
    await fetch('/api/analytics/non-tailor-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // Analytics should not block PDP interactions.
  }
}