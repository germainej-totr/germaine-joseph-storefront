import 'server-only';

import { capturePostHogEvent } from '@/lib/analytics/posthogServer';
import type { LifecycleAutomationEventName } from '@/lib/automation/lifecycleEventMap';

const KLAVIYO_EVENTS_URL = 'https://a.klaviyo.com/api/events/';
const KLAVIYO_REVISION = '2024-05-15';

export interface LifecycleMarketingEventPayload {
  email?: string;
  distinctId: string;
  occurredAt?: string;
  properties?: Record<string, unknown>;
}

export interface LifecycleMarketingEventResult {
  ok: boolean;
  klaviyo: { ok: boolean; skipped?: boolean; status?: number; error?: string };
  posthog: { ok: boolean; skipped?: boolean; error?: string };
}

function getKlaviyoConfig() {
  const privateApiKey =
    process.env.KLAVIYO_GJ_PRIVATE_API_KEY ||
    process.env.KLAVIYO_PRIVATE_API_KEY ||
    '';
  const defaultEnabled = String(process.env.KLAVIYO_BOOKING_EVENTS_ENABLED || 'false').toLowerCase() === 'true';
  const enabled =
    String(process.env.KLAVIYO_LIFECYCLE_EVENTS_ENABLED || String(defaultEnabled)).toLowerCase() === 'true';
  const metricPrefix = (
    process.env.KLAVIYO_LIFECYCLE_EVENT_PREFIX ||
    process.env.KLAVIYO_BOOKING_EVENT_PREFIX ||
    ''
  ).trim();
  return { privateApiKey, enabled, metricPrefix };
}

function withMetricPrefix(metric: string, prefix: string): string {
  if (!prefix) return metric;
  return `${prefix}_${metric}`;
}

async function emitKlaviyoLifecycleEvent(
  eventName: LifecycleAutomationEventName,
  payload: LifecycleMarketingEventPayload,
): Promise<{ ok: boolean; skipped?: boolean; status?: number; error?: string }> {
  const cfg = getKlaviyoConfig();

  if (!cfg.enabled) return { ok: true, skipped: true };
  if (!cfg.privateApiKey) return { ok: false, error: 'Missing KLAVIYO_PRIVATE_API_KEY' };
  if (!payload.email?.trim()) return { ok: true, skipped: true };

  const metricName = withMetricPrefix(eventName, cfg.metricPrefix);
  const response = await fetch(KLAVIYO_EVENTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${cfg.privateApiKey}`,
      Revision: KLAVIYO_REVISION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        type: 'event',
        attributes: {
          properties: {
            lifecycleEvent: eventName,
            metricName,
            ...(payload.properties || {}),
          },
          metric: {
            data: {
              type: 'metric',
              attributes: {
                name: metricName,
              },
            },
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: payload.email,
              },
            },
          },
          time: payload.occurredAt || new Date().toISOString(),
          unique_id: `${payload.distinctId}-${eventName}-${Date.now()}`,
        },
      },
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: `Klaviyo event API error: ${response.status} ${await response.text()}`,
    };
  }

  return { ok: true, status: response.status };
}

async function emitPosthogLifecycleEvent(
  eventName: LifecycleAutomationEventName,
  payload: LifecycleMarketingEventPayload,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  try {
    await capturePostHogEvent({
      event: eventName,
      distinctId: payload.distinctId,
      timestamp: payload.occurredAt,
      properties: {
        lifecycleEvent: eventName,
        ...(payload.properties || {}),
      },
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('posthog_not_configured')) {
      return { ok: true, skipped: true };
    }
    return { ok: false, error: message };
  }
}

export async function emitLifecycleMarketingEvent(
  eventName: LifecycleAutomationEventName,
  payload: LifecycleMarketingEventPayload,
): Promise<LifecycleMarketingEventResult> {
  const [klaviyo, posthog] = await Promise.all([
    emitKlaviyoLifecycleEvent(eventName, payload).catch((error) => ({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    })),
    emitPosthogLifecycleEvent(eventName, payload).catch((error) => ({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    })),
  ]);

  return {
    ok: klaviyo.ok && posthog.ok,
    klaviyo,
    posthog,
  };
}
