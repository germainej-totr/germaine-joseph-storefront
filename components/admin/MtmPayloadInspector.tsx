'use client';

/**
 * A19: Payload Inspector
 *
 * Collapsible JSON inspector for detailed diagnostics of the raw
 * canonical MTM payload.  Section headings let reviewers jump to
 * specific parts without wading through the full JSON blob.
 */

import { useState } from 'react';
import type { MtmCanonicalPayload } from '@/lib/mtm/MtmCanonicalSchema';

// ---------------------------------------------------------------------------
// JSON node renderer
// ---------------------------------------------------------------------------

function JsonNode({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const indent = depth * 16;

  if (value === null || value === undefined) {
    return <span className="text-slate-400 italic">null</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="text-violet-600">{String(value)}</span>;
  }

  if (typeof value === 'number') {
    return <span className="text-blue-600">{value}</span>;
  }

  if (typeof value === 'string') {
    return <span className="text-green-700 break-all">&quot;{value}&quot;</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400">[]</span>;
    return (
      <span>
        {'['}
        <ul style={{ paddingLeft: indent + 16 }} className="list-none m-0">
          {value.map((item, i) => (
            <li key={i} className="py-0.5">
              <JsonNode value={item} depth={depth + 1} />
              {i < value.length - 1 && <span className="text-slate-400">,</span>}
            </li>
          ))}
        </ul>
        <span style={{ paddingLeft: indent }}>{']'}</span>
      </span>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-slate-400">{'{}'}</span>;
    return (
      <span>
        {'{'}
        <ul style={{ paddingLeft: indent + 16 }} className="list-none m-0">
          {entries.map(([k, v], i) => (
            <li key={k} className="py-0.5">
              <span className="text-rose-600 font-medium">&quot;{k}&quot;</span>
              <span className="text-slate-500">: </span>
              <JsonNode value={v} depth={depth + 1} />
              {i < entries.length - 1 && <span className="text-slate-400">,</span>}
            </li>
          ))}
        </ul>
        <span style={{ paddingLeft: indent }}>{'}'}</span>
      </span>
    );
  }

  return <span className="text-slate-500">{String(value)}</span>;
}

// ---------------------------------------------------------------------------
// Collapsible section
// ---------------------------------------------------------------------------

function InspectorSection({
  title,
  value,
  defaultOpen = false,
}: {
  title: string;
  value: unknown;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded mb-2 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 text-left"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{title}</span>
        <span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-3 py-2 overflow-x-auto bg-white">
          <pre className="text-xs font-mono leading-relaxed">
            <JsonNode value={value} />
          </pre>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy-to-clipboard helper
// ---------------------------------------------------------------------------

function CopyButton({ payload }: { payload: MtmCanonicalPayload }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard api unavailable in some contexts
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded px-2 py-1 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy JSON'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export interface MtmPayloadInspectorProps {
  payload: MtmCanonicalPayload;
}

export function MtmPayloadInspector({ payload }: MtmPayloadInspectorProps) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <section aria-label="Payload inspector">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Payload Inspector
        </h3>
        <div className="flex items-center gap-2">
          <CopyButton payload={payload} />
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded px-2 py-1 transition-colors"
          >
            {showRaw ? 'Structured view' : 'Raw JSON'}
          </button>
        </div>
      </div>

      {showRaw ? (
        <div className="border border-slate-200 rounded overflow-x-auto bg-white">
          <pre className="text-xs font-mono leading-relaxed p-3">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      ) : (
        <div>
          <InspectorSection
            title={`Header — ${payload.category} · v${payload.version ?? '1'}`}
            value={{ id: payload.id, category: payload.category, version: payload.version, createdAt: payload.createdAt }}
            defaultOpen
          />
          <InspectorSection title="Fit Profile" value={payload.fitProfile} defaultOpen />
          <InspectorSection title="Design Snapshot" value={payload.design} />
          <InspectorSection title="Fit Context" value={payload.fit} />
          <InspectorSection title="MTM Specification" value={payload.mtmSpec} defaultOpen />
          <InspectorSection title="Line Item Properties" value={payload.lineItemProperties} />
          <InspectorSection title="Metadata" value={payload.metadata} />
        </div>
      )}
    </section>
  );
}
