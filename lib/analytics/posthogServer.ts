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
    return;
  }

  try {
    await fetch(`${config.host}/capture/`, {
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
  } catch {
    // Analytics must never break auth flow.
  }
}
