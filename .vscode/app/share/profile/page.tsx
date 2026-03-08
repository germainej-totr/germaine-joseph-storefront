'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Ruler, ShieldCheck, Scissors, Loader2 } from 'lucide-react';

function SharedProfileContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (email) {
      fetch(`/api/profile?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(json => {
          setData(json);
          setLoading(false);
        });
    }
  }, [email]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-zinc-200" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 flex justify-center text-black">
      <div className="max-w-xl w-full bg-white border border-zinc-200 shadow-sm animate-in fade-in duration-1000">
        
        {/* Maison Header */}
        <div className="p-10 text-center border-b border-zinc-100">
          <h1 className="font-serif text-2xl tracking-[0.3em] uppercase">Germaine Joseph</h1>
          <p className="text-zinc-400 text-[9px] tracking-widest mt-2 uppercase font-bold">
            Shared Pattern Specification
          </p>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          {/* Status Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Verified Pattern</span>
            </div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Ref: {email?.split('@')[0]}</span>
          </div>

          {/* Core Specifications */}
          <div className="grid grid-cols-3 gap-4 py-10 border-y border-zinc-100">
            <div className="text-center">
              <p className="text-[9px] text-zinc-400 uppercase font-bold mb-1">Jacket</p>
              <p className="text-3xl font-serif">{data.jacketSize}</p>
            </div>
            <div className="text-center border-x border-zinc-100">
              <p className="text-[9px] text-zinc-400 uppercase font-bold mb-1">Trouser</p>
              <p className="text-3xl font-serif">{data.trouserSize}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-zinc-400 uppercase font-bold mb-1">Intent</p>
              <p className="text-sm font-medium mt-2">{data.fitPreference}</p>
            </div>
          </div>

          {/* Engagement Footer */}
          <div className="space-y-6 text-center">
            <p className="text-xs text-zinc-500 italic">
              "The fit is the foundation. The rest is merely decoration."
            </p>
            <div className="pt-6">
               <a href="/" className="inline-block border border-black px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                  Book Your Own Fitting
               </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SharedProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Initialising Maison View...</div>}>
      <SharedProfileContent />
    </Suspense>
  );
}