'use client';
import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Calendar, Mail, Scissors, Download, Share2, ChevronRight } from 'lucide-react';
import { useBookingServiceTypes } from '@/hooks/useBookingServiceTypes';
import { buildIcsEventContent } from '@/lib/booking/calendar';

function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const selectedTime = searchParams.get('time') || '09:00 AM';
  const selectedDate = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const serviceType = searchParams.get('serviceType') || 'showroom';
  const useCase = searchParams.get('useCase') || 'Business';
  const isWedding = useCase === 'Wedding';
  const { serviceTypeMap } = useBookingServiceTypes();

  const downloadICS = () => {
    const title = `Fitting: Germaine Joseph Bespoke`;
    const durationMin = serviceTypeMap[serviceType]?.durationMin ?? 60;
    const icsContent = buildIcsEventContent({
      title,
      date: selectedDate,
      timeSlot: selectedTime,
      durationMin,
      location: 'Maison Showroom',
      description: `Service: ${serviceTypeMap[serviceType]?.label || serviceType}`,
    });

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'maison-appointment.ics');
    link.click();
  };

  const handleShare = async () => {
    const shareData = {
      title: isWedding ? 'Maison Appointment: Wedding Profile' : 'Maison Appointment: Technical Specs',
      text: isWedding 
        ? `I've finalized my wedding suit profile at Germaine Joseph. View the details here:`
        : `My bespoke measurement profile and technical specifications from Germaine Joseph:`,
      url: `${window.location.origin}/share/profile?email=${encodeURIComponent(searchParams.get('email') || '')}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch { console.log('Share cancelled'); }
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert("Profile link copied to clipboard");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FDFDFD] flex flex-col md:items-center md:justify-center p-0 md:p-4 text-black font-sans">
      <div className="flex-1 md:flex-initial w-full max-w-xl bg-white md:border md:border-zinc-100 md:shadow-2xl md:rounded-2xl overflow-hidden flex flex-col animate-in fade-in duration-700">
        
        {/* HEADER SECTION */}
        <div className="bg-black pt-16 pb-12 px-8 text-center text-white relative">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-full mb-6 border border-white/10 backdrop-blur-sm">
            <Check size={40} className="text-white" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-2xl md:text-3xl tracking-[0.2em] uppercase mb-2">Profile Secured</h1>
          <div className="inline-block px-4 py-1 border border-white/20 rounded-full">
             <p className="text-zinc-400 text-[9px] tracking-[0.2em] uppercase font-bold">{selectedTime} Appointment</p>
          </div>
        </div>

        {/* LOGISTICS HUB (Functional Actions) */}
        <div className="p-8 pb-4 space-y-4">
          <h2 className="font-serif text-lg tracking-tight border-b pb-4 border-zinc-100 italic">Logistics Hub</h2>
          
          <button onClick={downloadICS} className="w-full flex items-center justify-between p-5 bg-zinc-50 rounded-2xl border border-zinc-100 active:scale-[0.98] transition-all">
             <div className="flex gap-4 items-center">
               <div className="bg-black text-white p-2 rounded-lg"><Calendar size={18} /></div>
               <div className="text-left">
                 <p className="text-[10px] font-bold uppercase text-zinc-400">Add to Schedule</p>
                 <p className="text-sm font-medium">Sync to iCal / Google</p>
               </div>
             </div>
             <Download size={16} className="text-zinc-300" />
          </button>

          <button onClick={handleShare} className="w-full flex items-center justify-between p-5 bg-white rounded-2xl border border-zinc-100 active:scale-[0.98] shadow-sm transition-all">
             <div className="flex gap-4 items-center">
               <div className="bg-zinc-100 text-black p-2 rounded-lg"><Share2 size={18} /></div>
               <div className="text-left">
                 <p className="text-[10px] font-bold uppercase text-zinc-400">
                   {isWedding ? 'Wedding Coordination' : 'Documentation'}
                 </p>
                 <p className="text-sm font-medium">
                   {isWedding ? 'Share with Partner' : 'Export Specifications'}
                 </p>
               </div>
             </div>
             <ChevronRight size={16} className="text-zinc-300" />
          </button>
        </div>

        {/* NARRATIVE SECTION (The "Sacrificed" descriptive content) */}
        <div className="px-8 py-6 space-y-8">
          <div className="flex gap-5 items-start p-2">
            <Mail size={20} className="text-zinc-300 shrink-0" />
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Digital Pattern Review</h4>
              <p className="text-sm text-zinc-500 mt-1">A detailed summary has been dispatched to your email for your records.</p>
            </div>
          </div>

          <div className="flex gap-5 items-start p-2">
            <Scissors size={20} className="text-zinc-300 shrink-0" />
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Master Tailor Review</h4>
              <p className="text-sm text-zinc-500 mt-1">Our technical team is reviewing your build notes to prepare the exact blocks for your fitting.</p>
            </div>
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="p-8 pt-4 pb-12">
          <Link href="/" className="w-full flex items-center justify-center bg-black text-white py-5 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl active:scale-[0.98] transition-transform">
            Return to Maison
          </Link>
          <p className="text-[9px] text-zinc-300 text-center mt-6 uppercase tracking-widest">Est. 2026 | Germaine Joseph</p>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmed() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <BookingConfirmedContent />
    </Suspense>
  );
}