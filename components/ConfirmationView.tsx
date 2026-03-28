'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { calculateFitConfidence } from '@/lib/fit-logic';

interface ConfirmationFormData {
  body_build?: string;
  standing_posture?: string;
  shoulder_slope?: string;
  [key: string]: unknown;
}

export default function BookingConfirmation({ formData }: { formData: ConfirmationFormData }) {
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    // Simulate an "Analyzing" state for a premium feel
    const score = calculateFitConfidence(formData);
    setTimeout(() => setConfidence(score), 800);
  }, [formData]);

  return (
    <div className="text-center p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-200 animate-in fade-in zoom-in-95">
      {/* The Confidence Badge */}
      <div className="relative inline-block mb-6">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64" cy="64" r="60"
            stroke="currentColor" strokeWidth="2"
            fill="transparent" className="text-zinc-200"
          />
          <circle
            cx="64" cy="64" r="60"
            stroke="currentColor" strokeWidth="3"
            fill="transparent"
            strokeDasharray={377}
            strokeDashoffset={377 - (377 * confidence) / 100}
            className="text-black transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{confidence}%</span>
          <span className="text-[8px] uppercase tracking-tighter text-zinc-500">Confidence</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-serif">Profile Analysis Complete</h3>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto">
          Our algorithm has processed your <strong>{formData.body_build}</strong> build and <strong>{formData.standing_posture}</strong> posture. 
        </p>
      </div>

      <div className="mt-8 p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm text-left">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Master Tailor Note</span>
        </div>
        <p className="text-xs text-zinc-600 leading-relaxed">
          The <strong>{formData.shoulder_slope}</strong> shoulder adjustment has been flagged for your 1-on-1 fitting. We have allocated specialized block patterns for your arrival.
        </p>
      </div>
      
      <Link href="/c" className="block w-full mt-8 bg-black text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all text-center">
        Continue to Gallery
      </Link>
    </div>
  );
}