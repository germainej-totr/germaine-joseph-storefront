"use client";

import React, { useState, useEffect } from 'react';
import { upsertFittingSession } from "@/actions/fitting";

export default function FittingForm({ initialData }: { initialData: any }) {
  // --- State Management ---
  const [selectedConfigId, setSelectedConfigId] = useState(initialData?.productionLine || "");
  const [selectedJacketSize, setSelectedJacketSize] = useState(initialData?.jacketBaseBlock || "");
  const [selectedTrouserSize, setSelectedTrouserSize] = useState(initialData?.trouserBaseBlock || "");
  const [selectedFit, setSelectedFit] = useState(initialData?.masterFitType || "");
  const [measurements, setMeasurements] = useState(initialData?.measurements || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Recommended Pattern: Sync with Props ---
  useEffect(() => {
    if (initialData) {
      setSelectedConfigId(initialData.productionLine || "");
      setSelectedJacketSize(initialData.jacketBaseBlock || "");
      setSelectedTrouserSize(initialData.trouserBaseBlock || "");
      setSelectedFit(initialData.masterFitType || "");
      setMeasurements(initialData.measurements || {});
    }
  }, [initialData]);

  return (
    <div className="min-h-screen bg-[#F1EFEC] py-12 px-4">
      <div className="max-w-6xl mx-auto shadow-2xl rounded-2xl bg-white p-8">
        <h1 className="text-3xl font-light mb-8">Editing: {initialData?.id}</h1>

        {/* --- Diagnostic: Verify Field Mapping --- */}
        <pre className="text-xs bg-gray-100 p-4 mb-4 overflow-x-auto text-black">
          {JSON.stringify({ selectedJacketSize, selectedTrouserSize, selectedFit }, null, 2)}
        </pre>

        <form className="space-y-6">
          {/* --- Fix Styling & Binding: Jacket Base Block --- */}
          <div>
            <label className="block text-sm uppercase text-gray-700">Jacket Base Block</label>
            <input
              type="text"
              value={selectedJacketSize}
              onChange={(e) => setSelectedJacketSize(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-black outline-none"
            />
          </div>

          {/* --- Fix Styling & Binding: Trouser Base Block --- */}
          <div>
            <label className="block text-sm uppercase text-gray-700">Trouser Base Block</label>
            <input
              type="text"
              value={selectedTrouserSize} // Corrected Binding
              onChange={(e) => setSelectedTrouserSize(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-black outline-none"
            />
          </div>

          {/* --- Fix Styling & Binding: Master Fit Type --- */}
          <div>
            <label className="block text-sm uppercase text-gray-700">Master Fit Type</label>
            <input
              type="text"
              value={selectedFit}
              onChange={(e) => setSelectedFit(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-black outline-none"
            />
          </div>
        </form>
      </div>
    </div>
  );
}