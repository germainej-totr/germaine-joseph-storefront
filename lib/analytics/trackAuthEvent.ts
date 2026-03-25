import type { AuthEventName } from '@/lib/analytics/authContract';

interface TrackAuthEventInput {
  eventName: AuthEventName;
  distinctId?: string;
  email?: string;
  method?: string;
  oauthStatus?: string;
  oauthError?: string;
  errorMessage?: string;
}

export async function trackAuthEvent(input: TrackAuthEventInput) {
  try {
    await fetch('/api/analytics/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_name: input.eventName,
        occurred_at: new Date().toISOString(),
        distinct_id: input.distinctId,
        email: input.email,
        method: input.method,
        oauth_status: input.oauthStatus,
        oauth_error: input.oauthError,
        error_message: input.errorMessage,
        source: 'gjm_auth_ui',
      }),
      keepalive: true,
    });
  } catch {
    // Client analytics failures should be silent.
  }
}
