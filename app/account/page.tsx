import Link from 'next/link';
import { getSessionContext } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AccountSessionActions from '@/components/AccountSessionActions';
import AccountLinkForm from '@/components/AccountLinkForm';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 py-3 text-sm">
      <span className="font-medium text-zinc-500">{label}</span>
      <span className="text-right text-zinc-900">{value}</span>
    </div>
  );
}

export default async function AccountPage() {
  let session = null;

  try {
    session = await getSessionContext();
  } catch {
    session = null;
  }

  const profile = session?.email
    ? await prisma.fitProfile.findUnique({
        where: { email: session.email },
        select: {
          id: true,
          email: true,
          profile_name: true,
          jacketSize: true,
          trouserSize: true,
          fitPreference: true,
          updatedAt: true,
          isActive: true,
        },
      })
    : null;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Tailor On The Road</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Account</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            This app-side account page gives customers a stable route back into the storefront and access to their fit profile state.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/shop"
            className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Return to shop
          </Link>
          {session ? <AccountSessionActions /> : null}
        </div>
      </header>

      {!session ? (
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-zinc-950">No app session found</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            A signed app session is created when a customer completes the fit-profile flow. You can also bridge from your Shopify customer identity here using a one-time code sent to the same email address.
          </p>

          <AccountLinkForm />

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/configure-fit"
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Start fitting flow
            </Link>
            <Link
              href="/product/mtm-trouser-test-build"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
            >
              Open MTM product
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1.3fr_0.9fr]">
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Session</p>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-950">Welcome back</h2>
            </div>

            <InfoRow label="Email" value={session.email} />
            <InfoRow label="Session ID" value={session.sessionId} />
            <InfoRow label="Customer ID" value={session.customerId || 'Pending Shopify bridge'} />
            <InfoRow label="Session expiry" value={new Date(session.expiresAt).toLocaleString()} />
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Fit profile</p>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-950">Current status</h2>
            </div>

            {profile ? (
              <>
                <InfoRow label="Profile" value={profile.profile_name || 'Saved profile'} />
                <InfoRow label="Fit profile ID" value={profile.id} />
                <InfoRow label="Jacket size" value={profile.jacketSize || 'Not set'} />
                <InfoRow label="Trouser size" value={profile.trouserSize || 'Not set'} />
                <InfoRow label="Preference" value={profile.fitPreference || 'Not set'} />
                <InfoRow label="Updated" value={profile.updatedAt.toLocaleDateString()} />
                <InfoRow label="Status" value={profile.isActive ? 'Active' : 'Inactive'} />
              </>
            ) : (
              <p className="text-sm leading-6 text-zinc-600">
                No fit profile has been associated with this session yet. Start the fitting flow to create one and unlock saved-fit gating.
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/configure-fit"
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
              >
                Update fitting
              </Link>
              <Link
                href="/product/mtm-trouser-test-build"
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
              >
                Return to MTM product
              </Link>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}