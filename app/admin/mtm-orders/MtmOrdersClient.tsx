'use client';

/**
 * A19: Admin MTM Orders — list page client component.
 *
 * Receives serialisable order rows from the server page and provides
 * in-browser filtering/sorting.  Each row links to the detail review page.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';

export interface MtmOrderRow {
  id: string;
  orderId: string;
  category: string;
  customerEmail: string;
  status: string;
  readiness: 'ready' | 'warning' | 'blocked';
  createdAt: string;
  fitProfileId: string;
}

export interface MtmOrdersClientProps {
  initialOrders: MtmOrderRow[];
}

// ---------------------------------------------------------------------------
// Readiness badge colours
// ---------------------------------------------------------------------------

const READINESS_CLS: Record<string, string> = {
  ready: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  blocked: 'bg-red-100 text-red-700',
};

const READINESS_LABEL: Record<string, string> = {
  ready: 'Ready',
  warning: 'Review Required',
  blocked: 'Blocked',
};

const STATUS_CLS: Record<string, string> = {
  queued: 'bg-slate-100 text-slate-600',
  in_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  sent_to_tailor: 'bg-violet-100 text-violet-700',
  completed: 'bg-green-200 text-green-800',
  cancelled: 'bg-red-100 text-red-600',
};

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Filter + search bar
// ---------------------------------------------------------------------------

type Readiness = 'all' | 'ready' | 'warning' | 'blocked';

function FilterBar({
  query,
  readiness,
  onQuery,
  onReadiness,
}: {
  query: string;
  readiness: Readiness;
  onQuery: (v: string) => void;
  onReadiness: (v: Readiness) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 mb-5">
      <input
        type="search"
        placeholder="Search by email, order ID, category…"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        className="flex-1 min-w-52 rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#826300]/40"
      />
      <select
        value={readiness}
        onChange={(e) => onReadiness(e.target.value as Readiness)}
        className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#826300]/40"
      >
        <option value="all">All readiness</option>
        <option value="ready">Ready</option>
        <option value="warning">Review Required</option>
        <option value="blocked">Blocked</option>
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order row
// ---------------------------------------------------------------------------

function OrderRowItem({ order }: { order: MtmOrderRow }) {
  const readinessCls = READINESS_CLS[order.readiness] ?? 'bg-slate-100 text-slate-600';
  const readinessLbl = READINESS_LABEL[order.readiness] ?? order.readiness;
  const statusCls = STATUS_CLS[order.status] ?? 'bg-slate-100 text-slate-600';
  const createdDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
        {order.orderId.slice(0, 8)}…
      </td>
      <td className="px-4 py-3 text-sm font-medium text-slate-800 capitalize">{order.category}</td>
      <td className="px-4 py-3 text-sm text-slate-600 break-all">{order.customerEmail}</td>
      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{createdDate}</td>
      <td className="px-4 py-3">
        <Badge label={statusCls ? order.status.replace('_', ' ') : order.status} cls={statusCls} />
      </td>
      <td className="px-4 py-3">
        <Badge label={readinessLbl} cls={readinessCls} />
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/admin/mtm-orders/${order.id}`}
          className="text-xs font-semibold text-[#826300] hover:underline"
        >
          Review →
        </Link>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MtmOrdersClient({ initialOrders }: MtmOrdersClientProps) {
  const [query, setQuery] = useState('');
  const [readiness, setReadiness] = useState<Readiness>('all');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return initialOrders.filter((o) => {
      if (readiness !== 'all' && o.readiness !== readiness) return false;
      if (!q) return true;
      return (
        o.orderId.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q)
      );
    });
  }, [initialOrders, query, readiness]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">MTM Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            {initialOrders.length} order{initialOrders.length !== 1 ? 's' : ''} in system
          </p>
        </div>
        <span className="text-xs text-slate-400">Internal review only</span>
      </div>

      <FilterBar query={query} readiness={readiness} onQuery={setQuery} onReadiness={setReadiness} />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium mb-1">No orders found</p>
          <p className="text-sm">Adjust your search or filter criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Order ID', 'Category', 'Customer', 'Created', 'Status', 'Readiness', ''].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((order) => (
                <OrderRowItem key={order.id} order={order} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
