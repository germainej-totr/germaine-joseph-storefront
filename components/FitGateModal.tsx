'use client';
import { useState } from 'react';
import { Home, Briefcase, MapPin, Store } from 'lucide-react';
import { FALLBACK_BOOKING_LOCATIONS } from '@/lib/booking/locationCatalogClient';

interface FitGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
}

const initialFormData = {
  height_cm: '',
  weight_kg: '',
  body_build: '',
  shoulder_slope: '',
  standing_posture: '',
  chest_profile: '',
  stomach_profile: '',
  seat_shape: '',
  fit_preference: '',
  primary_use_case: '',
  appointment_mode: '',
  timeline_urgency: '',
  profile_name: ''
};

type FormDataType = typeof initialFormData;

const STUDIO_LOCATION =
  FALLBACK_BOOKING_LOCATIONS.find((location) => location.enabled && location.supportsShowroom)?.address ||
  'Maison Showroom (address shared on confirmation)';

function mapAppointmentModeToServiceType(mode: string): 'showroom' | 'home_office' {
  return mode === 'Studio' ? 'showroom' : 'home_office';
}

const OptionBtn = ({ field, value, label, formData, updateData, next }: { field: keyof FormDataType; value: string; label?: string; formData: FormDataType; updateData: (k: keyof FormDataType, v: string) => void; next: () => void }) => (
  <button 
    onClick={() => { updateData(field, value); next(); }}
    className={`w-full text-left p-4 border rounded-xl transition-all hover:bg-zinc-50 ${formData[field] === value ? 'border-black bg-zinc-50 ring-1 ring-black font-medium' : 'border-zinc-200'}`}
  >
    {label || value}
  </button>
);

export default function FitGateModal({ isOpen, onClose, productTitle }: FitGateModalProps) {
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState(''); 
  
  const [formData, setFormData] = useState<FormDataType>(initialFormData);

  // Aligned with Regex ^(Studio|Home|Office|Location)$
  const appointmentModes = [
    { 
      id: 'Studio', 
      label: 'Maison Studio Visit', 
      icon: <Store size={18} className="text-zinc-500" /> 
    },
    { 
      id: 'Home', 
      label: 'At My Home', 
      icon: <Home size={18} className="text-zinc-500" /> 
    },
    { 
      id: 'Office', 
      label: 'At My Office', 
      icon: <Briefcase size={18} className="text-zinc-500" /> 
    },
    { 
      id: 'Location', 
      label: 'On Location', 
      icon: <MapPin size={18} className="text-zinc-500" /> 
    }
  ];

  if (!isOpen) return null;

  const updateData = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const handleFinalSubmit = () => {
    if (!userEmail) {
      alert("Please enter your email to save your profile.");
      return;
    }

    const chestEstimate = Math.round(Number(formData.weight_kg) * 1.25); 
    const waistEstimate = Math.round(chestEstimate - 12);

    const serviceType = mapAppointmentModeToServiceType(formData.appointment_mode);
    const prefilledLocation = serviceType === 'showroom' ? STUDIO_LOCATION : '';

    const params = new URLSearchParams({
      email: userEmail,
      source: 'fit-gate-modal',
      serviceType,
      chest: chestEstimate.toString(),
      waist: waistEstimate.toString(),
      height: formData.height_cm,
      weight: formData.weight_kg,
      bodyBuild: formData.body_build,
      shoulderSlope: formData.shoulder_slope,
      standingPosture: formData.standing_posture,
      chestProfile: formData.chest_profile,
      stomachProfile: formData.stomach_profile,
      seatShape: formData.seat_shape,
      fitPreference: formData.fit_preference,
      primaryUseCase: formData.primary_use_case,
      appointmentMode: formData.appointment_mode,
      productionTimeline: formData.timeline_urgency,
      profileName: formData.profile_name,
      notes: `Mode: ${formData.appointment_mode} | Timeline: ${formData.timeline_urgency} | Build: ${formData.body_build}`
    });

    if (prefilledLocation) {
      params.set('location', prefilledLocation);
    }

    window.location.href = `/configure-fit?${params.toString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-black">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-100">
          <div className="h-full bg-zinc-900 transition-all duration-500" style={{ width: `${(step / 12) * 100}%` }} />
        </div>

        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-black">✕</button>

        <div className="mt-4 flex flex-col min-h-[550px]">
          <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-4">Step {step} of 12</span>

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif">Dimensions for {productTitle}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Height (cm)</label>
                  <input type="number" placeholder="180" className="w-full border-b-2 p-2 outline-none focus:border-black" onChange={(e) => updateData('height_cm', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Weight (kg)</label>
                  <input type="number" placeholder="80" className="w-full border-b-2 p-2 outline-none focus:border-black" onChange={(e) => updateData('weight_kg', e.target.value)} />
                </div>
              </div>
              <button disabled={!formData.height_cm || !formData.weight_kg} onClick={next} className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest">Continue</button>
            </div>
          )}

          {step === 2 && <div className="space-y-3"><h2 className="text-xl font-serif mb-4">Body Build</h2>{['Slim', 'Athletic', 'Average', 'Broad'].map(v => <OptionBtn key={v} field="body_build" value={v} formData={formData} updateData={updateData} next={next} />)}</div>}
          {step === 3 && <div className="space-y-3"><h2 className="text-xl font-serif mb-4">Shoulder Slope</h2>{['Flat', 'Average', 'Sloped'].map(v => <OptionBtn key={v} field="shoulder_slope" value={v} formData={formData} updateData={updateData} next={next} />)}</div>}
          {step === 4 && <div className="space-y-3"><h2 className="text-xl font-serif mb-4">Chest Profile</h2>{['Flat', 'Average', 'Prominent'].map(v => <OptionBtn key={v} field="chest_profile" value={v} formData={formData} updateData={updateData} next={next} />)}</div>}
          {step === 5 && <div className="space-y-3"><h2 className="text-xl font-serif mb-4">Stomach Profile</h2>{['Flat', 'Average', 'Rounded'].map(v => <OptionBtn key={v} field="stomach_profile" value={v} formData={formData} updateData={updateData} next={next} />)}</div>}
          {step === 6 && <div className="space-y-3"><h2 className="text-xl font-serif mb-4">Standing Posture</h2>{['Stooped', 'Neutral', 'Erect'].map(v => <OptionBtn key={v} field="standing_posture" value={v} formData={formData} updateData={updateData} next={next} />)}</div>}
          {step === 7 && <div className="space-y-3"><h2 className="text-xl font-serif mb-4">Seat Shape</h2>{['Flat', 'Average', 'Large'].map(v => <OptionBtn key={v} field="seat_shape" value={v} formData={formData} updateData={updateData} next={next} />)}</div>}
          {step === 8 && <div className="space-y-3"><h2 className="text-xl font-serif mb-4">Fit Preference</h2>{['Slim', 'Tailored', 'Relaxed', 'Classic'].map(v => <OptionBtn key={v} field="fit_preference" value={v} formData={formData} updateData={updateData} next={next} />)}</div>}
          {step === 9 && <div className="space-y-3"><h2 className="text-xl font-serif mb-4">Primary Use Case</h2>{['Business', 'Wedding', 'Formal Event', 'Casual'].map(v => <OptionBtn key={v} field="primary_use_case" value={v} formData={formData} updateData={updateData} next={next} />)}</div>}
          
          {/* Step 10: Appointment Mode - Now using structured array with Studio */}
          {step === 10 && (
            <div className="space-y-3">
              <h2 className="text-xl font-serif mb-4">Appointment Mode</h2>
              <div className="space-y-3">
                {appointmentModes.map((mode) => (
                  <button 
                    key={mode.id}
                    onClick={() => { updateData('appointment_mode', mode.id); next(); }}
                    className={`w-full flex items-center justify-between p-5 border rounded-xl transition-all hover:bg-zinc-50 ${formData.appointment_mode === mode.id ? 'border-black bg-zinc-50 ring-1 ring-black' : 'border-zinc-200'}`}
                  >
                    <span className="text-sm font-medium">{mode.label}</span>
                    {mode.icon}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 pt-2">
                Studio bookings default to: {STUDIO_LOCATION}
              </p>
            </div>
          )}

          {step === 11 && (
            <div className="space-y-2 overflow-y-auto pr-2 max-h-[450px]">
              <h2 className="text-xl font-serif mb-4">Production Timeline</h2>
              <OptionBtn field="timeline_urgency" value="5_days" label="5 Days (RLP Priority Rush + Surcharge)" formData={formData} updateData={updateData} next={next} />
              <OptionBtn field="timeline_urgency" value="7_days" label="7 Days (RLP Priority Rush + Surcharge)" formData={formData} updateData={updateData} next={next} />
              <OptionBtn field="timeline_urgency" value="8_days" label="8 Days (BLP Express + Surcharge)" formData={formData} updateData={updateData} next={next} />
              <OptionBtn field="timeline_urgency" value="14_days" label="14 Days (RLP Express)" formData={formData} updateData={updateData} next={next} />
              <OptionBtn field="timeline_urgency" value="3_weeks" label="3 Weeks (Standard)" formData={formData} updateData={updateData} next={next} />
              <OptionBtn field="timeline_urgency" value="Flexible" label="Flexible" formData={formData} updateData={updateData} next={next} />
            </div>
          )}

          {step === 12 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif">Review Profile</h2>
              <div className="bg-zinc-50 p-4 rounded-xl text-xs space-y-2 border border-zinc-100">
                <div className="flex justify-between"><span className="text-zinc-400 uppercase">Anatomy</span> <span>{formData.height_cm}cm / {formData.weight_kg}kg</span></div>
                <div className="flex justify-between"><span className="text-zinc-400 uppercase">Timeline</span> <span className="text-right ml-4">{formData.timeline_urgency.replace('_', ' ')}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400 uppercase">Mode</span> <span>{formData.appointment_mode}</span></div>
              </div>
              
              <div className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  className="w-full border-b-2 p-2 outline-none focus:border-black font-medium text-lg" 
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)} 
                />
                <input 
                  type="text" 
                  placeholder="Profile Name (e.g. Blue Wedding Suit)" 
                  className="w-full border p-4 rounded-xl text-sm" 
                  onChange={(e) => updateData('profile_name', e.target.value)} 
                />
              </div>

              <button onClick={handleFinalSubmit} className="w-full bg-black text-white py-5 rounded-xl font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-transform">
                Save & Configure Smart Fit
              </button>
            </div>
          )}

          {step > 1 && (
            <button onClick={back} className="mt-auto pt-4 text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:text-black">← Back</button>
          )}
        </div>
      </div>
    </div>
  );
}