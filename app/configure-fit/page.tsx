'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Calendar, ArrowRight, Loader2, Ruler, MapPin, Users, Heart, Lock, Unlock, Clock } from 'lucide-react';
import { sendOffsiteAlert } from '@/app/actions/sendOffsiteAlert';

// THE SOURCE OF TRUTH: Data for exact block specifications
const measurementSpecs: any = {
  "drop_8": {
    "jacket": {
      "46": { "back_length": 73.3, "shoulders": 44.0, "half_waist": 45.5 },
      "48": { "back_length": 73.9, "shoulders": 45.0, "half_waist": 47.5 },
      "50": { "back_length": 74.5, "shoulders": 46.0, "half_waist": 49.5 },
      "52": { "back_length": 75.1, "shoulders": 47.0, "half_waist": 51.5 },
      "54": { "back_length": 75.7, "shoulders": 48.0, "half_waist": 53.6 }
    },
    "trouser": {
      "46": { "half_waist": 41.0, "rise": 17.8, "hem": 18.4 },
      "48": { "half_waist": 43.0, "rise": 18.1, "hem": 18.7 },
      "50": { "half_waist": 45.0, "rise": 18.5, "hem": 19.0 },
      "52": { "half_waist": 47.0, "rise": 18.8, "hem": 19.3 },
      "54": { "half_waist": 49.0, "rise": 19.5, "hem": 19.6 }
    }
  },
  "drop_7": {
    "jacket": {
      "48": { "back_length": 73.9, "shoulders": 45.5, "half_waist": 50.0 },
      "50": { "back_length": 74.5, "shoulders": 46.5, "half_waist": 52.0 },
      "52": { "back_length": 75.1, "shoulders": 47.5, "half_waist": 54.0 }
    },
    "trouser": {
      "48": { "half_waist": 43.0, "rise": 19.1, "hem": 20.7 },
      "50": { "half_waist": 45.0, "rise": 19.5, "hem": 21.0 },
      "52": { "half_waist": 47.0, "rise": 19.8, "hem": 21.3 }
    }
  },
  "drop_6": {
    "jacket": {
      "50": { "back_length": 76.5, "shoulders": 47.0, "half_waist": 54.0 },
      "52": { "back_length": 77.1, "shoulders": 48.0, "half_waist": 56.0 },
      "54": { "back_length": 77.7, "shoulders": 49.0, "half_waist": 58.1 }
    },
    "trouser": {
      "50": { "half_waist": 45.0, "rise": 22.5, "hem": 22.0 },
      "52": { "half_waist": 47.0, "rise": 22.8, "hem": 22.3 },
      "54": { "half_waist": 49.0, "rise": 23.5, "hem": 22.6 }
    }
  }
};

function FitConfiguratorContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(''); // NEW: Appointment Date
  const [selectedTime, setSelectedTime] = useState('');
  const [onLocationAddress, setOnLocationAddress] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [bridalPartyCount, setBridalPartyCount] = useState('1');

  const [modalData, setModalData] = useState({
    useCase: '',
    appointmentMode: '',
    timeline: '',
    bodyBuild: '',
    profileName: ''
  });
  
  const [attributes, setAttributes] = useState({
    chest: '', stomach: '', waist: '', hips: '', height: '', commonIssues: '', notes: ''          
  });

  const [preferences, setPreferences] = useState({
    fitType: 'drop_8', trouserRise: 'Mid-Rise', trouserBreak: 'No Break', jacketLength: 'Standard'
  });

  const [result, setResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Helper for Date Logic
  const getMinBookingDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2); // 48h lead time
    return date.toISOString().split('T')[0];
  };

  const generateTimeSlots = () => {
    const slots = [];
    let currentTime = new Date();
    currentTime.setHours(9, 0, 0);
    const duration = 75;
    const buffer = 30;

    for (let i = 0; i < 6; i++) {
      // Generate time in 12-hour format with AM/PM
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

      slots.push(timeString);
      currentTime.setMinutes(currentTime.getMinutes() + duration + buffer);
    }
    return slots;
  };

  useEffect(() => {
    const email = searchParams.get('email');
    const useCase = searchParams.get('primaryUseCase');
    const mode = searchParams.get('appointmentMode');
    
    if (email) {
        setUserEmail(email);
        setIsAutoFilled(true);
    }
    
    setModalData({
      useCase: useCase || '',
      appointmentMode: mode || 'Studio', 
      timeline: searchParams.get('productionTimeline') || '',
      bodyBuild: searchParams.get('bodyBuild') || '',
      profileName: searchParams.get('profileName') || 'New Bespoke Profile'
    });
    
    setAttributes(prev => ({
      ...prev,
      commonIssues: searchParams.get('issues') || '',
      notes: searchParams.get('notes') || '',
      height: searchParams.get('height') || ''
    }));
  }, [searchParams]);

  const handlePhysicalSubmit = () => {
    if (!attributes.chest || !attributes.stomach || !attributes.waist || !attributes.hips || !userEmail) {
      alert("Please complete all physical measurements and email to proceed.");
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(2);
  };

  const runDigitalTailor = () => {
    const jSize = Math.round(Number(attributes.chest) / 2);
    const tSize = Math.round((Number(attributes.waist) / 2) + 5);
    const jacketSpecs = measurementSpecs[preferences.fitType]?.jacket[jSize.toString()] || null;
    const trouserSpecs = measurementSpecs[preferences.fitType]?.trouser[tSize.toString()] || null;

    setResult({
      jacketSize: jSize,
      trouserSize: tSize,
      jacketSpecs,
      trouserSpecs,
      isMismatch: jSize !== tSize,
      label: preferences.fitType === 'drop_8' ? 'Slim Fit' : preferences.fitType === 'drop_7' ? 'Regular Fit' : 'Classic Fit'
    });
    setStep(3);
  };

  const confirmForFitting = async (finalTime?: string) => {
    console.log('[confirmForFitting] Called with finalTime:', finalTime);
    console.log('[confirmForFitting] Current state - selectedTime:', selectedTime, 'selectedDate:', selectedDate);

    const offsiteModes = ['Home', 'Office', 'Location'];
    const isOffsite = offsiteModes.includes(modalData.appointmentMode);

    if (!selectedDate) {
        alert("Please select a date for your fitting.");
        return;
    }

    if (!selectedTime && !finalTime) {
        alert("Please select a time slot for your fitting.");
        return;
    }

    if (isOffsite && !onLocationAddress) {
        alert("Please provide the fitting address for On-Location service.");
        return;
    }

    setIsSaving(true);
    try {
      // Determine the time to use
      const appointmentTimeValue = finalTime || selectedTime;

      console.log('[confirmForFitting] Submitting:', {
        email: userEmail,
        appointmentDate: selectedDate,
        appointmentTime: appointmentTimeValue,
        finalTime,
        selectedTime
      });

      // First, create the fit profile with all details
      const profilePayload = {
        email: userEmail,
        label: modalData.profileName || 'New Profile',
        categoryDefaults: {
          jacket: { size: result.jacketSize.toString() },
          trouser: { size: result.trouserSize.toString() }
        },
        fitPreference: result.label,
        appointmentDate: selectedDate,
        appointmentTime: appointmentTimeValue,
        technicalSpecs: {
          attributes: { 
            ...attributes, 
            onLocationAddress,
            weddingDate,
            bridalPartyCount,
            ...modalData 
          },
          preferences,
          jacket: result.jacketSpecs,
          trouser: result.trouserSpecs,
        }
      };

      console.log('[confirmForFitting] Sending profilePayload to /api/fit/profile:', profilePayload);

      const profileResponse = await fetch('/api/fit/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload),
      });

      console.log('[confirmForFitting] Profile response status:', profileResponse.status, profileResponse.statusText);

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('[confirmForFitting] API error response:', errorText);
        throw new Error(`Failed to create fit profile: ${profileResponse.status} ${profileResponse.statusText} - ${errorText}`);
      }

      const profile = await profileResponse.json();
      console.log('[confirmForFitting] Profile created successfully:', profile.id);

      // Set the fit profile cookie
      document.cookie = `fit_profile_id=${profile.id}; path=/; max-age=31536000`; // 1 year

      // Prepare booking payload with the created profile ID
      const payload = {
        email: userEmail,
        fitPreference: result.label,
        jacketSize: result.jacketSize,
        trouserSize: result.trouserSize,
        appointmentDate: selectedDate,
        appointmentTime: finalTime || selectedTime,
        technicalSpecs: {
          attributes: { 
            ...attributes, 
            onLocationAddress,
            weddingDate,
            bridalPartyCount,
            ...modalData 
          },
          preferences,
          jacket: result.jacketSpecs,
          trouser: result.trouserSpecs,
        },
        bookingId: profile.id // Use the new profile ID
      };

      const response = await fetch('/api/bookings/update-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (isOffsite) {
        await sendOffsiteAlert({
          email: userEmail,
          appointmentMode: modalData.appointmentMode,
          address: onLocationAddress,
          profileName: modalData.profileName,
          date: selectedDate, // Added date to alert
          time: finalTime || selectedTime
        });
      }

      if (response.ok) {
        window.location.href = `/?success=profile_synced&date=${selectedDate}`;
      }
    } catch (error) {
      console.error('[confirmForFitting] Submission failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error submitting profile: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FDFDFD] p-4 text-black font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        
        <div className="bg-black p-8 text-center">
          <h1 className="text-white font-serif text-3xl tracking-[0.2em] uppercase">Germaine Joseph</h1>
          <p className="text-zinc-400 text-[10px] mt-2 uppercase tracking-widest">Master Tailor Intake</p>
        </div>

        <div className="p-8 md:p-12">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-8">
                <h3 className="text-xl font-serif tracking-widest uppercase">Physical Profile</h3>
              </div>
              <div className="space-y-1 relative">
                <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Account Email</label>
                    {isAutoFilled && (
                        <button onClick={() => setIsAutoFilled(false)} className="text-[9px] text-zinc-300 hover:text-black flex items-center gap-1">
                            <Unlock size={10}/> Edit
                        </button>
                    )}
                </div>
                <input 
                    type="email" 
                    readOnly={isAutoFilled}
                    className={`w-full p-4 border-b outline-none transition-all ${isAutoFilled ? "bg-gray-50/80 text-zinc-400 italic" : "bg-gray-50/50"}`} 
                    value={userEmail} 
                    onChange={(e)=>setUserEmail(e.target.value)} 
                />
                {isAutoFilled && <Lock size={12} className="absolute right-4 bottom-5 text-zinc-200" />}
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Ruler size={12}/> Chest (cm)</label>
                  <input type="number" className="w-full p-4 border-b bg-gray-50/50 outline-none" value={attributes.chest} onChange={(e)=>setAttributes({...attributes, chest: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stomach (cm)</label>
                  <input type="number" className="w-full p-4 border-b bg-gray-50/50 outline-none" value={attributes.stomach} onChange={(e)=>setAttributes({...attributes, stomach: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Ruler size={12}/> Waist (cm)</label>
                  <input type="number" className="w-full p-4 border-b bg-gray-50/50 outline-none" value={attributes.waist} onChange={(e)=>setAttributes({...attributes, waist: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Hips (cm)</label>
                  <input type="number" className="w-full p-4 border-b bg-gray-50/50 outline-none" value={attributes.hips} onChange={(e)=>setAttributes({...attributes, hips: e.target.value})} />
                </div>
              </div>
              <button onClick={handlePhysicalSubmit} className="w-full bg-black text-white py-5 mt-4 rounded-sm font-bold uppercase tracking-widest hover:bg-zinc-900 transition-all">
                Configure Style Preferences
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="text-center"><h3 className="text-xl font-serif">Stylistic Configuration</h3></div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Silhouette Intent</label>
                <div className="grid grid-cols-3 gap-3">
                  {['drop_8', 'drop_7', 'drop_6'].map(d => (
                    <button key={d} onClick={()=>setPreferences({...preferences, fitType: d})} className={`py-4 text-[10px] tracking-widest border ${preferences.fitType === d ? 'bg-black text-white' : 'border-gray-200 text-gray-400'}`}>
                      {d === 'drop_8' ? 'SLIM' : d === 'drop_7' ? 'REGULAR' : 'CLASSIC'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={runDigitalTailor} className="w-full bg-black text-white py-5 rounded-sm font-bold uppercase tracking-widest shadow-xl">Generate Digital Profile</button>
            </div>
          )}

          {step === 3 && result && (
            <div className="text-center space-y-8 animate-in slide-in-from-bottom-8">
                <div className="bg-zinc-50 p-10 rounded-2xl border border-zinc-100">
                   <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 mb-6 font-bold">MTM Specification</p>
                   <div className="flex justify-center items-baseline gap-12 my-8">
                     <div><p className="text-5xl font-serif">{result.jacketSize}</p><p className="text-[10px] uppercase font-bold text-zinc-500">Jacket</p></div>
                     <div className="h-12 w-[1px] bg-zinc-200"></div>
                     <div><p className="text-5xl font-serif">{result.trouserSize}</p><p className="text-[10px] uppercase font-bold text-zinc-500">Trouser</p></div>
                   </div>
                </div>
                <button onClick={() => setStep(4)} disabled={isSaving} className="w-full bg-black text-white py-6 rounded-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3">
                  Confirm & Schedule Fitting
                </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-serif uppercase tracking-widest">Fitting Logistics</h2>
                <p className="text-zinc-500 text-sm mt-2">Finalize your {modalData.useCase} coordination.</p>
              </div>

              {modalData.useCase === 'Wedding' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-zinc-50 rounded-xl border-2 border-black/5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2"><Heart size={12}/> Wedding Date</label>
                    <input type="date" className="w-full p-3 border rounded-md text-sm" value={weddingDate} onChange={(e)=>setWeddingDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2"><Users size={12}/> Bridal Party Size</label>
                    <select className="w-full p-3 border rounded-md text-sm" value={bridalPartyCount} onChange={(e)=>setBridalPartyCount(e.target.value)}>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} Person{n>1?'s':''}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* LOGISTICS: DATE & LOCATION */}
              <div className="grid grid-cols-1 gap-6">
                {/* Unified Date Selection */}
                <div className="p-6 bg-zinc-50 rounded-xl border-2 border-black/5 space-y-3">
                   <label className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2"><Calendar size={12}/> Appointment Date</label>
                   <input 
                      type="date" 
                      min={getMinBookingDate()}
                      className="w-full p-4 border rounded-md text-sm bg-white" 
                      value={selectedDate} 
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedTime(''); // Reset time when date changes
                      }} 
                   />
                   <p className="text-[9px] text-zinc-400 italic font-medium">* 48-hour minimum coordination lead time required.</p>
                </div>

                {['Home', 'Office', 'Location'].includes(modalData.appointmentMode) ? (
                    <div className="space-y-2 p-6 bg-zinc-50 rounded-xl border-2 border-black/5">
                        <label className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2"><MapPin size={12}/> Fitting Location Address</label>
                        <textarea 
                            placeholder="Please provide full street address..." 
                            className="w-full p-3 border rounded-md text-sm min-h-[80px]" 
                            value={onLocationAddress} 
                            onChange={(e)=>setOnLocationAddress(e.target.value)}
                        />
                    </div>
                ) : (
                    <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-100 flex items-start gap-4">
                        <div className="p-2 bg-black text-white rounded-lg"><MapPin size={16}/></div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Maison Location</p>
                            <p className="text-sm font-medium mt-1">102 Savile Row, London, W1S 3PB</p>
                        </div>
                    </div>
                )}
              </div>

              {/* TIME SLOTS: Only active if date is selected */}
              <div className={`border border-zinc-100 rounded-xl p-6 bg-[#F9F9F9] transition-all duration-500 ${selectedDate ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <div className="flex items-center gap-2 mb-4">
                    <Clock size={12} className="text-zinc-400" />
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Available Windows</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {generateTimeSlots().map((time) => (
                      <button 
                        key={time} 
                        onClick={() => setSelectedTime(time)} 
                        className={`py-4 text-xs font-bold border rounded-sm transition-all ${selectedTime === time ? 'bg-black text-white' : 'bg-white text-zinc-600 hover:border-black'}`}
                      >
                        {time}
                      </button>
                    ))}
                </div>
              </div>

              <button 
                onClick={() => confirmForFitting(selectedTime)} 
                disabled={!selectedTime || !selectedDate || isSaving || (['Home', 'Office', 'Location'].includes(modalData.appointmentMode) && !onLocationAddress)} 
                className="w-full py-5 bg-black text-white rounded-sm font-bold uppercase tracking-[0.2em] disabled:bg-zinc-200 shadow-xl transition-all"
              >
                {isSaving ? "Synchronizing Silhouette..." : "Finalize & Secure Profile"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FitConfiguratorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-zinc-300" size={48} /></div>}>
      <FitConfiguratorContent />
    </Suspense>
  );
}