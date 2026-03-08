// lib/auth.ts
import { cookies } from 'next/headers';

export async function getSessionContext() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session_id');
  
  if (!session) throw new Error("Unauthorized");
  
  // Logic to map session to customerId via your Database
  return { customerId: "gid://shopify/Customer/..." }; 
}