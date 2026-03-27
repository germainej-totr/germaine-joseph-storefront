interface PostHogCaptureInput {
  event: string;
  distinctId: string;
  timestamp?: string;
  properties?: Record<string, unknown>;
}

function getPostHogConfig() {
  return {
    host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
    apiKey: process.env.POSTHOG_API_KEY || '',
  };
}

export async function capturePostHogEvent(input: PostHogCaptureInput) {
  const config = getPostHogConfig();
  if (!config.apiKey) {
    throw new Error('posthog_not_configured');
  }

  const response = await fetch(`${config.host}/capture/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: config.apiKey,
      event: input.event,
      distinct_id: input.distinctId,
      timestamp: input.timestamp || new Date().toISOString(),
      properties: input.properties || {},
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`posthog_capture_failed:${response.status}:${details}`);
  }
}
