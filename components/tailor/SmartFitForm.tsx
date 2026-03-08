"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { validateMeasurement, MeasurementGuide } from '@/lib/tailor-engine';

interface SmartFitFormProps {
  guide: MeasurementGuide; // The JSON from Shopify
  category: string;        // 'jacket' | 'trouser'
  userEmail: string;
}

export default function SmartFitForm({ guide, category, userEmail }: SmartFitFormProps) {
  const [values, setValues] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Handle input change & real-time validation
  const handleChange = (key: string, val: string) => {
    const numVal = parseFloat(val);
    setValues(prev => ({ ...prev, [key]: numVal }));

    const validation = validateMeasurement(key, numVal, guide);
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [key]: validation.error || 'Invalid value' }));
    } else {
      const newErrors = { ...errors };
      delete newErrors[key];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(errors).length > 0) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          category,
          measurements: values,
          source: 'smart_fit_v1'
        }),
      });

      if (response.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save measurements", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-stone-200 rounded-sm shadow-sm">
      <div className="flex items-center gap-3 mb-8 border-b border-stone-100 pb-4">
        <Ruler className="text-stone-400" size={20} />
        <h2 className="text-xl font-light tracking-widest uppercase text-stone-800">
          {category} Anatomical Profile
        </h2>
      </div>

      <div className="space-y-8">
        {Object.entries(guide).map(([key, rule]) => (
          <motion.div key={key} layout className="relative">
            <div className="flex justify-between items-end mb-2">
              <label className="text-xs uppercase tracking-tighter text-stone-500 font-medium">
                {rule.label}
              </label>
              <span className="text-[10px] text-stone-400 italic">
                Range: {rule.min_cm} - {rule.max_cm} cm
              </span>
            </div>

            <input
              type="number"
              placeholder={`Enter ${rule.label.toLowerCase()}...`}
              className={`w-full bg-stone-50 border-b-2 py-3 px-1 outline-none transition-all duration-300 ${
                errors[key] ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-stone-800'
              }`}
              onChange={(e) => handleChange(key, e.target.value)}
            />

            <AnimatePresence>
              {errors[key] && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] text-red-500 mt-1 flex items-center gap-1"
                >
                  <AlertCircle size={12} /> {errors[key]}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || Object.keys(values).length === 0}
        className="mt-12 w-full py-4 bg-stone-900 text-white text-xs uppercase tracking-[0.2em] hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:bg-stone-300"
      >
        {isSubmitting ? "Processing..." : isSaved ? (
          <> <CheckCircle2 size={16} /> Profile Saved </>
        ) : (
          <> <Save size={16} /> Commit to Profile </>
        )}
      </button>
    </div>
  );
}