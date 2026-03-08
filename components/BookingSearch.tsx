'use client';

import { useState } from 'react';
import { AppointmentRequest, ServiceTypeId } from '@/types/booking';

// Define what the parent component needs to provide
interface BookingSearchProps {
  onConfirm: (data: any) => void;
}

const SERVICES: { id: ServiceTypeId; name: string; duration: string }[] = [
  { id: 'showroom', name: 'Showroom Fitting', duration: '60 min' },
  { id: 'home_office', name: 'Home, Office, or On-Location', duration: '90 min' },
  { id: 'virtual', name: 'Virtual Styling Consultation', duration: '30 min' },
];

export default function BookingSearch({ onConfirm }: BookingSearchProps) {
  const [request, setRequest] = useState<Partial<AppointmentRequest>>({
    serviceType: 'showroom',
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleDateChange = async (date: string) => {
    setIsSearching(true);
    setRequest((prev) => ({ ...prev, date }));
    
    // In production, this would be: 
    // const res = await fetch(`/api/booking/available?date=${date}`);
    setTimeout(() => {
      const mockSlots = ['09:00 AM', '11:00 AM', '01:30 PM', '04:00 PM'];
      setAvailableSlots(mockSlots);
      setIsSearching(false);
    }, 600);
  };

  const handleConfirm = async () => {
    try {
      // THE BRIDGE: Calling the API route we created in /app/api/booking/confirm
      const response = await fetch('/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const result = await response.json();
      
      if (result.success) {
        // Success: Trigger the Parent to show ConfirmationView
        onConfirm({ ...request, bookingId: result.bookingId });
      } else {
        alert("Atelier Busy: " + result.message);
      }
    } catch (error) {
      console.error("Booking failed:", error);
      alert("System connection error. Please try again.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-[2.5rem] shadow-xl border border-zinc-100 animate-in fade-in zoom-in-95">
      <header className="text-center mb-10">
        <h2 className="text-3xl font-serif mb-2 text-zinc-900">Schedule Your Fitting</h2>
        <p className="text-zinc-500 text-sm italic">Complimentary service across all major Australian cities.</p>
      </header>

      {/* 1. Service Selection */}
      <div className="space-y-3 mb-8">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">1. Select Experience</label>
        <div className="grid grid-cols-1 gap-2">
          {SERVICES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setRequest({ ...request, serviceType: s.id })}
              className={`p-4 border rounded-2xl text-left transition-all flex justify-between items-center ${
                request.serviceType === s.id ? 'border-black bg-zinc-50 ring-1 ring-black' : 'border-zinc-200 hover:border-zinc-400'
              }`}
            >
              <div>
                <div className="font-bold text-sm text-zinc-900">{s.name}</div>
                <div className="text-xs text-zinc-500">{s.duration}</div>
              </div>
              {request.serviceType === s.id && <span className="text-black font-bold">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Location */}
      <div className="space-y-3 mb-8">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">2. Your Location</label>
        <input 
          type="text"
          placeholder={request.serviceType === 'showroom' ? "City (e.g. Melbourne)" : "Full Address or Hotel for fitting"}
          className="w-full p-4 border border-zinc-200 rounded-2xl outline-none focus:border-black transition-colors text-zinc-900"
          onChange={(e) => setRequest({ ...request, location: e.target.value })}
        />
      </div>

      {/* 3. Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">3. Select Date</label>
          <input 
            type="date" 
            className="w-full p-4 border border-zinc-200 rounded-2xl outline-none focus:border-black text-zinc-900"
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">4. Select Time</label>
          <div className="relative">
            <select 
              disabled={availableSlots.length === 0}
              className="w-full p-4 border border-zinc-200 rounded-2xl outline-none appearance-none focus:border-black disabled:bg-zinc-50 transition-colors text-zinc-900 bg-transparent"
              onChange={(e) => setRequest({ ...request, timeSlot: e.target.value })}
            >
              <option value="">Select a time...</option>
              {availableSlots.map(time => <option key={time} value={time}>{time}</option>)}
            </select>
            {isSearching && <div className="absolute right-4 top-4 animate-spin text-zinc-400">◌</div>}
          </div>
        </div>
      </div>

      {/* 4. Submit */}
      <button 
        type="button"
        onClick={handleConfirm}
        disabled={!request.timeSlot || !request.location}
        className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all disabled:bg-zinc-100 disabled:text-zinc-400 active:scale-[0.98] shadow-lg shadow-black/5"
      >
        Confirm Appointment
      </button>
      
      <p className="text-center text-[10px] text-zinc-400 mt-6 uppercase tracking-widest font-medium">
        Free Travel & Fitting • Nationwide Service
      </p>
    </div>
  );
}