import { parseBookingManageToken } from '@/lib/session';
import { getSessionContext } from '@/lib/auth';

type BookingAccessInput = {
  request: Request;
  bookingId: string;
  bookingEmail: string;
  fitProfileCustomerId?: string | null;
  manageToken?: string | null;
};

export async function hasBookingAccess(input: BookingAccessInput): Promise<boolean> {
  const bookingEmail = input.bookingEmail.trim().toLowerCase();

  const url = new URL(input.request.url);
  const tokenCandidate =
    input.manageToken ||
    url.searchParams.get('manageToken') ||
    input.request.headers.get('x-gjm-manage-token') ||
    '';

  const parsedToken = parseBookingManageToken(tokenCandidate);
  if (
    parsedToken &&
    parsedToken.bookingId === input.bookingId &&
    parsedToken.email === bookingEmail
  ) {
    return true;
  }

  try {
    const session = await getSessionContext();
    const sessionEmail = session.email.trim().toLowerCase();
    if (sessionEmail && sessionEmail === bookingEmail) {
      return true;
    }

    if (
      input.fitProfileCustomerId &&
      session.customerId &&
      input.fitProfileCustomerId === session.customerId
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}