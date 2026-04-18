import { addMtmItemToCart } from '@/lib/shopify/ShopifyMtmItemAddToCartBridge';

export type UpdateFitProfilePayload = {
  email: string;
  label: string;
  categoryDefaults: {
    jacket: { size: string };
    trouser: { size: string };
  };
  fitPreference: string;
  appointmentDate: string;
  appointmentTime: string;
  technicalSpecs: Record<string, unknown>;
};

type UpdateFitProfileResponse = {
  ok?: boolean;
  profile?: { id?: string };
};

export async function updateFitProfile(payload: UpdateFitProfilePayload): Promise<{ profileId: string }> {
  const profileResponse = await fetch('/api/fit/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!profileResponse.ok) {
    const errorText = await profileResponse.text();
    throw new Error(
      `Failed to create fit profile: ${profileResponse.status} ${profileResponse.statusText} - ${errorText}`,
    );
  }

  const profilePayloadResponse = (await profileResponse.json()) as UpdateFitProfileResponse;
  const profileId = profilePayloadResponse.profile?.id;

  if (!profileId) {
    throw new Error('Fit profile response did not include an id');
  }

  return { profileId };
}

export type UpdateBookingDetailsPayload = {
  email: string;
  fitPreference: string;
  jacketSize: number;
  trouserSize: number;
  appointmentDate: string;
  appointmentTime: string;
  technicalSpecs: Record<string, unknown>;
  cartAttributes: Record<string, string>;
  fitProfileId: string;
  bookingId: string;
};

export async function updateBookingDetails(
  payload: UpdateBookingDetailsPayload,
): Promise<{ promotedBookingId: string | null }> {
  const response = await fetch('/api/bookings/update-fit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const bookingError = await response.text();
    throw new Error(`Failed to update booking: ${response.status} ${response.statusText} - ${bookingError}`);
  }

  const fitSyncResult = (await response.json().catch(() => null)) as
    | { promotedBookingId?: string | null }
    | null;

  const promotedBookingId =
    typeof fitSyncResult?.promotedBookingId === 'string' && fitSyncResult.promotedBookingId
      ? fitSyncResult.promotedBookingId
      : null;

  return { promotedBookingId };
}

export async function addSuitToCartBridge(payload: {
  variantId: string;
  cartAttributes: Record<string, string>;
}): Promise<{ ok: boolean; error?: string }> {
  return addMtmItemToCart({
    variantId: payload.variantId,
    quantity: 1,
    customAttributes: payload.cartAttributes,
  });
}
