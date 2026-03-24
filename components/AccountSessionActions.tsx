'use client';

import { useState } from 'react';

export default function AccountSessionActions() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });
    } finally {
      window.location.href = '/account';
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-60"
    >
      {isSigningOut ? 'Signing out...' : 'Sign out'}
    </button>
  );
}