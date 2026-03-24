// lib/auth.ts
import { cookies } from 'next/headers';
import { parseSession } from '@/lib/session';

export interface SessionContext {
  sessionId: string;
  customerId: string;
  email: string;
  expiresAt: string;
}

/**
 * Strict session guard for MTM gate decisions.
 *
 * Expected cookies (set by auth layer):
 * - session_id
 * - session_customer_id
 * - session_email
 */
export async function getSessionContext(): Promise<SessionContext> {
  const cookieStore = await cookies();

  const signedSession = parseSession(cookieStore.get('gjm_session')?.value);
  if (signedSession) {
    return signedSession;
  }

  if (process.env.ALLOW_LEGACY_SESSION_COOKIES !== 'true') {
    throw new Error('Unauthorized');
  }

  const sessionId = cookieStore.get('session_id')?.value || '';
  const customerId = cookieStore.get('session_customer_id')?.value || '';
  const email = cookieStore.get('session_email')?.value || '';

  if (!sessionId || !email) {
    throw new Error('Unauthorized');
  }

  return {
    sessionId,
    customerId,
    email: email.toLowerCase(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
  };
}
