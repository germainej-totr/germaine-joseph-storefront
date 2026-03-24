'use client';

import { useState } from 'react';

type Stage = 'request' | 'verify';

export default function AccountLinkForm() {
  const [stage, setStage] = useState<Stage>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send code');
      }

      setStage('verify');
      setMessage('Verification code sent. Check your inbox and enter the six-digit code below.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send code');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/link/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to verify code');
      }

      window.location.href = '/account';
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
      <h3 className="text-lg font-semibold text-zinc-950">Link your Shopify customer identity</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        Use the same email you use on the Shopify hosted account page. We will verify ownership with a one-time code and create the signed app session used by MTM gating.
      </p>

      {stage === 'request' ? (
        <form className="mt-5 space-y-4" onSubmit={requestCode}>
          <label className="block text-sm font-medium text-zinc-700">
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
              placeholder="you@example.com"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? 'Sending code...' : 'Send sign-in code'}
          </button>
        </form>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={verifyCode}>
          <label className="block text-sm font-medium text-zinc-700">
            Six-digit code
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              required
              className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm tracking-[0.3em] text-zinc-900 outline-none transition focus:border-zinc-900"
              placeholder="123456"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify and sign in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStage('request');
                setCode('');
                setError('');
                setMessage('');
              }}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}

      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}