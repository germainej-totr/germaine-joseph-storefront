import 'server-only';

type BookingLifecycleEventName =
  | 'booking_confirmed'
  | 'booking_rescheduled'
  | 'booking_cancelled'
  | 'booking_fit_refresh_required';

type BookingLifecycleEventPayload = {
  bookingId: string;
  email: string;
  serviceType?: string;
  date?: string;
  timeSlot?: string;
  location?: string;
  source?: string;
};

const KLAVIYO_EVENTS_URL = 'https://a.klaviyo.com/api/events/';
const KLAVIYO_REVISION = '2024-05-15';

function getEnvConfig() {
  const privateApiKey =
    process.env.KLAVIYO_GJ_PRIVATE_API_KEY ||
    process.env.KLAVIYO_PRIVATE_API_KEY ||
    '';
  const enabled = String(process.env.KLAVIYO_BOOKING_EVENTS_ENABLED || 'false').toLowerCase() === 'true';
  const metricPrefix = (process.env.KLAVIYO_BOOKING_EVENT_PREFIX || '').trim();
  const accountLabel = (process.env.KLAVIYO_ACCOUNT_LABEL || 'germainejoseph').trim();
  return { privateApiKey, enabled, metricPrefix, accountLabel };
}

function toMetricName(eventName: BookingLifecycleEventName, prefix: string): string {
  if (!prefix) return eventName;
  return `${prefix}_${eventName}`;
}

export async function emitBookingLifecycleEvent(
  eventName: BookingLifecycleEventName,
  payload: BookingLifecycleEventPayload,
): Promise<{ ok: boolean; skipped?: boolean; status?: number; error?: string }> {
  const { privateApiKey, enabled, metricPrefix, accountLabel } = getEnvConfig();

  if (!enabled) {
    return { ok: true, skipped: true };
  }

  if (!privateApiKey) {
    return { ok: false, error: 'Missing KLAVIYO_PRIVATE_API_KEY' };
  }

  if (!payload.email?.trim()) {
    return { ok: false, error: 'Missing email for booking lifecycle event' };
  }

  try {
    const scheduledAt = payload.date && payload.timeSlot
      ? `${payload.date} ${payload.timeSlot}`
      : undefined;

    const metricName = toMetricName(eventName, metricPrefix);

    const response = await fetch(KLAVIYO_EVENTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Klaviyo-API-Key ${privateApiKey}`,
        Revision: KLAVIYO_REVISION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            properties: {
              bookingId: payload.bookingId,
              serviceType: payload.serviceType,
              date: payload.date,
              timeSlot: payload.timeSlot,
              scheduledAt,
              location: payload.location,
              source: payload.source || 'storefront',
              lifecycleEvent: eventName,
              metricName,
              accountLabel,
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
            time: new Date().toISOString(),
            unique_id: `${payload.bookingId}-${eventName}-${Date.now()}`,
          },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        status: response.status,
        error: `Klaviyo event API error: ${response.status} ${body}`,
      };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
