import type { FitFlowEventName } from '@/lib/analytics/fitFlowContract';

interface TrackFitFlowEventInput {
  eventName: FitFlowEventName;
  flowName: 'smart' | 'manual' | 'configure';
  email?: string;
  fitProfileId?: string;
  productHandle?: string;
  variantId?: string;
  destination?: string;
  errorMessage?: string;
  source?: string;
}

export async function trackFitFlowEvent(input: TrackFitFlowEventInput) {
  try {
    await fetch('/api/analytics/fit-flow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_name: input.eventName,
        occurred_at: new Date().toISOString(),
        flow_name: input.flowName,
        email: input.email,
        fit_profile_id: input.fitProfileId,
        product_handle: input.productHandle,
        variant_id: input.variantId,
        destination: input.destination,
        error_message: input.errorMessage,
        source: input.source || 'gjm_fit_ui',
      }),
      keepalive: true,
    });
  } catch {
    // Fit analytics should never block user flow.
  }
}
