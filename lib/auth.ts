// lib/auth.ts
import { cookies } from 'next/headers';

export interface SessionContext {
  sessionId: string;
  customerId: string;
  email: string;
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

  const sessionId = cookieStore.get('session_id')?.value || '';
  const customerId = cookieStore.get('session_customer_id')?.value || '';
  const email = cookieStore.get('session_email')?.value || '';

  if (!sessionId || !customerId || !email) {
    throw new Error('Unauthorized');
  }

  return {
    sessionId,
    customerId,
    email: email.toLowerCase(),
  };
}
