'use client';

import { useState, useMemo } from 'react';
import type {
  Fabric,
  FabricFilters,
  FabricSeason,
  FabricColourFamily,
  FabricPattern,
} from '@/types/fabric';
import {
  FABRIC_SEASON_LABELS,
  FABRIC_COLOUR_FAMILY_LABELS,
  FABRIC_PATTERN_LABELS,
} from '@/types/fabric';
import type { MtmCategory } from '@/types/mtm';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FabricSelectorProps {
  /** Full list of fabrics — fetched server-side and passed as prop */
  fabrics: Fabric[];
  /** Currently selected fabric id (controlled) */
  selectedId?: string;
  /** Fires when the customer chooses or clears a fabric */
  onSelect: (fabric: Fabric | null) => void;
  /** Restrict visible fabrics to this category (pre-applies suitability filter) */
  category?: MtmCategory;
  /** Currency symbol for price display */
  currencySymbol?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function fmtUpcharge(pence: number, symbol: string): string {
  if (!pence) return 'Included';
  return `+${symbol}${(pence / 100).toFixed(2)}`;
}

function applyFilters(fabrics: Fabric[], filters: FabricFilters): Fabric[] {
  return fabrics.filter((f) => {
    if (filters.category && !f.suitableFor.includes(filters.category)) return false;
    if (filters.mill && f.mill.toLowerCase() !== filters.mill.toLowerCase()) return false;
    if (filters.season && f.season !== filters.season) return false;
    if (filters.colourFamily && f.colourFamily !== filters.colourFamily) return false;
    if (filters.pattern && f.pattern !== filters.pattern) return false;
    if (filters.minWeightGm !== undefined && (f.weightGm ?? 0) < filters.minWeightGm) return false;
    if (filters.maxWeightGm !== undefined && (f.weightGm ?? Infinity) > filters.maxWeightGm) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      if (
        !f.name.toLowerCase().includes(q) &&
        !f.mill.toLowerCase().includes(q) &&
        !f.composition.toLowerCase().includes(q) &&
        !(f.articleCode ?? '').toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Filter bar sub-component
// ---------------------------------------------------------------------------

interface FilterBarProps {
  filters: FabricFilters;
  mills: string[];
  onChange: (next: FabricFilters) => void;
}

function FilterBar({ filters, mills, onChange }: FilterBarProps) {
  const seasons = Object.keys(FABRIC_SEASON_LABELS) as FabricSeason[];
  const colours = Object.keys(FABRIC_COLOUR_FAMILY_LABELS) as FabricColourFamily[];
  const patterns = Object.keys(FABRIC_PATTERN_LABELS) as FabricPattern[];

  const selectClass =
    'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#826300] focus:border-[#826300]';

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Search */}
      <input
        type="search"
        placeholder="Search fabrics…"
        value={filters.searchQuery ?? ''}
        onChange={(e) => onChange({ ...filters, searchQuery: e.target.value || undefined })}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#826300] focus:border-[#826300] w-48"
      />

      {/* Mill */}
      <select
        value={filters.mill ?? ''}
        onChange={(e) => onChange({ ...filters, mill: e.target.value || undefined })}
        className={selectClass}
        aria-label="Filter by mill"
      >
        <option value="">All Mills</option>
        {mills.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {/* Season */}
      <select
        value={filters.season ?? ''}
        onChange={(e) => onChange({ ...filters, season: (e.target.value as FabricSeason) || undefined })}
        className={selectClass}
        aria-label="Filter by season"
      >
        <option value="">All Seasons</option>
        {seasons.map((s) => (
          <option key={s} value={s}>{FABRIC_SEASON_LABELS[s]}</option>
        ))}
      </select>

      {/* Colour family */}
      <select
        value={filters.colourFamily ?? ''}
        onChange={(e) => onChange({ ...filters, colourFamily: (e.target.value as FabricColourFamily) || undefined })}
        className={selectClass}
        aria-label="Filter by colour"
      >
        <option value="">All Colours</option>
        {colours.map((c) => (
          <option key={c} value={c}>{FABRIC_COLOUR_FAMILY_LABELS[c]}</option>
        ))}
      </select>

      {/* Pattern */}
      <select
        value={filters.pattern ?? ''}
        onChange={(e) => onChange({ ...filters, pattern: (e.target.value as FabricPattern) || undefined })}
        className={selectClass}
        aria-label="Filter by pattern"
      >
        <option value="">All Patterns</option>
        {patterns.map((p) => (
          <option key={p} value={p}>{FABRIC_PATTERN_LABELS[p]}</option>
        ))}
      </select>

      {/* Clear */}
      {(filters.mill || filters.season || filters.colourFamily || filters.pattern || filters.searchQuery) && (
        <button
          type="button"
          onClick={() => onChange({ category: filters.category })}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fabric card sub-component
// ---------------------------------------------------------------------------

interface FabricCardProps {
  fabric: Fabric;
  selected: boolean;
  onSelect: () => void;
  currencySymbol: string;
}

function FabricCard({ fabric, selected, onSelect, currencySymbol }: FabricCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={[
        'relative flex flex-col text-left rounded-2xl border overflow-hidden',
        'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#826300]',
        selected
          ? 'border-[#826300] ring-2 ring-[#826300] bg-amber-50'
          : 'border-gray-200 bg-white hover:border-[#826300]/60 hover:shadow-md',
      ].join(' ')}
    >
      {/* Swatch image */}
      <div className="aspect-square w-full bg-gray-100 overflow-hidden">
        {fabric.swatchImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fabric.swatchImageUrl}
            alt={`${fabric.name} swatch`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs select-none">
            No swatch
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-0.5 flex-1">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{fabric.mill}</span>
        <span className="text-sm font-semibold text-gray-900 leading-snug">{fabric.name}</span>
        <span className="text-xs text-gray-500">{fabric.composition}</span>
        {fabric.weightGm && (
          <span className="text-xs text-gray-400">{fabric.weightGm} g/m</span>
        )}
        <span className="mt-auto pt-2 text-xs font-semibold text-[#826300]">
          {fmtUpcharge(fabric.upchargePence, currencySymbol)}
        </span>
        {fabric.isLimitedEdition && (
          <span className="text-[10px] font-medium text-amber-700 bg-amber-100 rounded-full px-2 py-0.5 w-fit">
            Limited Edition
          </span>
        )}
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#826300] flex items-center justify-center shadow">
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Selected fabric detail panel
// ---------------------------------------------------------------------------

function FabricDetailPanel({
  fabric,
  onClear,
  currencySymbol,
}: {
  fabric: Fabric;
  onClear: () => void;
  currencySymbol: string;
}) {
  return (
    <div className="mt-4 flex gap-4 rounded-2xl border border-[#826300]/30 bg-amber-50 p-4">
      {fabric.drapeImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fabric.drapeImageUrl}
          alt={`${fabric.name} drape`}
          className="w-24 h-32 object-cover rounded-xl flex-shrink-0 border border-amber-200"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{fabric.mill}</p>
            <h4 className="text-base font-semibold text-gray-900 leading-tight">{fabric.name}</h4>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
            aria-label="Remove fabric selection"
          >
            Change
          </button>
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
          <dt className="text-gray-400">Composition</dt>
          <dd>{fabric.composition}</dd>
          {fabric.weightGm && (
            <>
              <dt className="text-gray-400">Weight</dt>
              <dd>{fabric.weightGm} g/m</dd>
            </>
          )}
          <dt className="text-gray-400">Pattern</dt>
          <dd>{FABRIC_PATTERN_LABELS[fabric.pattern]}</dd>
          <dt className="text-gray-400">Season</dt>
          <dd>{FABRIC_SEASON_LABELS[fabric.season]}</dd>
          {fabric.careInstructions && (
            <>
              <dt className="text-gray-400">Care</dt>
              <dd>{fabric.careInstructions}</dd>
            </>
          )}
          <dt className="text-gray-400">Upcharge</dt>
          <dd className="font-semibold text-[#826300]">{fmtUpcharge(fabric.upchargePence, currencySymbol)}</dd>
        </dl>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FabricSelector — main export
// ---------------------------------------------------------------------------

export default function FabricSelector({
  fabrics,
  selectedId,
  onSelect,
  category,
  currencySymbol = '£',
}: FabricSelectorProps) {
  const [filters, setFilters] = useState<FabricFilters>({ category });

  // Unique mill list for the filter dropdown
  const mills = useMemo(
    () => Array.from(new Set(fabrics.filter((f) => f.isActive).map((f) => f.mill))).sort(),
    [fabrics],
  );

  const visible = useMemo(() => applyFilters(fabrics, filters), [fabrics, filters]);
  const selectedFabric = useMemo(
    () => fabrics.find((f) => f.id === selectedId) ?? null,
    [fabrics, selectedId],
  );

  return (
    <div>
      <FilterBar filters={filters} mills={mills} onChange={setFilters} />

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No fabrics match your filters.{' '}
          <button
            type="button"
            className="underline hover:text-gray-600"
            onClick={() => setFilters({ category })}
          >
            Clear filters
          </button>
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {visible.map((fabric) => (
            <FabricCard
              key={fabric.id}
              fabric={fabric}
              selected={fabric.id === selectedId}
              currencySymbol={currencySymbol}
              onSelect={() =>
                onSelect(fabric.id === selectedId ? null : fabric)
              }
            />
          ))}
        </div>
      )}

      {selectedFabric && (
        <FabricDetailPanel
          fabric={selectedFabric}
          onClear={() => onSelect(null)}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}
