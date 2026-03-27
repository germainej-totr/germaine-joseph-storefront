"use client";

import React, { useState, FormEvent } from 'react';
import { upsertFittingSession } from "@/actions/fitting";
import { FITTING_CONFIGS, ProductionConfig, FittingField } from '@/lib/fitting-configs';

interface FittingInitialData {
  id?: string;
  productionLine?: string | null;
  jacketBaseBlock?: string | null;
  trouserBaseBlock?: string | null;
  masterFitType?: string | null;
  measurements?: unknown;
  [key: string]: unknown;
}

function normalizeMeasurements(input: unknown): Record<string, unknown> {
  if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

export default function FittingForm({ initialData }: { initialData: FittingInitialData }) {
  // --- State Management ---
  const [selectedConfigId, setSelectedConfigId] = useState(initialData?.productionLine || "");
  const [selectedJacketSize, setSelectedJacketSize] = useState(initialData?.jacketBaseBlock || "");
  const [selectedTrouserSize, setSelectedTrouserSize] = useState(initialData?.trouserBaseBlock || "");
  const [selectedFit, setSelectedFit] = useState(initialData?.masterFitType || "");
  const [measurements, setMeasurements] = useState<Record<string, unknown>>(
    normalizeMeasurements(initialData?.measurements)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config: ProductionConfig | undefined = selectedConfigId ? FITTING_CONFIGS[selectedConfigId] : undefined;

  const handleMeasurementChange = (id: string, value: unknown) => {
    setMeasurements(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      ...initialData,
      productionLine: selectedConfigId,
      jacketBaseBlock: selectedJacketSize,
      trouserBaseBlock: selectedTrouserSize,
      masterFitType: selectedFit,
      measurements,
    };
    const res = await upsertFittingSession(payload);
    console.log('save result', res);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F1EFEC] py-12 px-4">
      <div className="max-w-6xl mx-auto shadow-2xl rounded-2xl bg-white p-8">
        <h1 className="text-3xl font-light mb-8">Editing: {initialData?.id}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* configuration selector */}
          <div>
            <label className="block text-sm uppercase text-gray-700">Production Line</label>
            <select
              value={selectedConfigId}
              onChange={(e) => setSelectedConfigId(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg bg-white outline-none"
            >
              <option value="">-- choose --</option>
              {Object.values(FITTING_CONFIGS).map(cfg => (
                <option key={cfg.id} value={cfg.id}>{cfg.label}</option>
              ))}
            </select>
          </div>

          {/* blocks */}
          {config?.blocks && (
            <>
              <div>
                <label className="block text-sm uppercase text-gray-700">Jacket Base Block</label>
                <select
                  value={selectedJacketSize}
                  onChange={(e) => setSelectedJacketSize(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg bg-white outline-none"
                >
                  <option value="">--</option>
                  {config.blocks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm uppercase text-gray-700">Trouser Base Block</label>
                <select
                  value={selectedTrouserSize}
                  onChange={(e) => setSelectedTrouserSize(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg bg-white outline-none"
                >
                  <option value="">--</option>
                  {config.blocks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </>
          )}

          {/* master fit type fallback */}
          {!config && (
            <div>
              <label className="block text-sm uppercase text-gray-700">Master Fit Type</label>
              <input
                type="text"
                value={selectedFit}
                onChange={(e) => setSelectedFit(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-black outline-none"
              />
            </div>
          )}

          {/* dynamic measurement fields */}
          {config && config.fields.map((f: FittingField) => {
            if (f.type === 'section_break') {
              return <h2 key={f.id} className="text-xl font-semibold mt-8">{f.label}</h2>;
            }
            const rawValue = measurements[f.id];
            const inputValue =
              typeof rawValue === 'string' || typeof rawValue === 'number'
                ? rawValue
                : '';
            const checkboxValue = Boolean(rawValue);
            switch (f.type) {
              case 'cm':
              case 'adjustment':
                return (
                  <div key={f.id}>
                    <label className="block text-sm uppercase text-gray-700">{f.label}</label>
                    <input
                      type="number"
                      value={inputValue}
                      min={f.min}
                      max={f.max}
                      step={f.step || (f.type === 'adjustment' ? 0.5 : 0.1)}
                      onChange={(e) => handleMeasurementChange(f.id, e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>
                );
              case 'option':
                return (
                  <div key={f.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checkboxValue}
                      onChange={(e) => handleMeasurementChange(f.id, e.target.checked)}
                    />
                    <label className="text-sm uppercase text-gray-700">{f.label}</label>
                  </div>
                );
              case 'text':
                return (
                  <div key={f.id}>
                    <label className="block text-sm uppercase text-gray-700">{f.label}</label>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => handleMeasurementChange(f.id, e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>
                );
              default:
                return null;
            }
          })}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full py-4 bg-black text-white uppercase font-bold rounded-lg disabled:bg-gray-400"
          >
            {isSubmitting ? 'Saving...' : 'Save Session'}
          </button>
        </form>
      </div>
    </div>
  );
}