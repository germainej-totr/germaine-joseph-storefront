import Link from 'next/link';

import type { AccountHistorySummary } from '@/lib/account/AccountHistoryService';

type Props = {
  history: AccountHistorySummary;
};

function formatServiceType(serviceType: string): string {
  return serviceType.replace(/_/g, ' ');
}

export default function AccountHistoryCard({ history }: Props) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">History</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-950">Your appointments and MTM orders</h2>
        </div>
        <Link
          href="/dashboard"
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
        >
          Open dashboard
        </Link>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Recent bookings</h3>
          {history.bookings.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No bookings found for this account yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {history.bookings.map((booking) => (
                <li key={booking.id} className="rounded-xl border border-zinc-100 px-3 py-2 text-sm">
                  <p className="font-medium text-zinc-900 capitalize">{formatServiceType(booking.serviceType)}</p>
                  <p className="text-zinc-600">{new Date(booking.startAt).toLocaleString()}</p>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Status: {booking.status}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Recent MTM orders</h3>
          {history.mtmOrders.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No MTM production specs linked to this account yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {history.mtmOrders.map((order) => (
                <li key={order.id} className="rounded-xl border border-zinc-100 px-3 py-2 text-sm">
                  <p className="font-medium text-zinc-900">Order: {order.orderId}</p>
                  <p className="text-zinc-600">Created: {new Date(order.createdAt).toLocaleString()}</p>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Status: {order.status}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}