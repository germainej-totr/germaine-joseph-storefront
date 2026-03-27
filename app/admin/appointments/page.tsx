'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BookingViewModel {
  id: string;
  email: string;
  technicalSpecs?: {
    attributes?: Record<string, string>;
    preferences?: Record<string, string>;
  };
  appointmentDate?: string;
  appointmentTime?: string;
  fitPreference?: string;
  jacketSize?: string;
  trouserSize?: string;
  serviceType?: string;
}

export default function AppointmentsPage() {
  const [bookings, setBookings] = useState<BookingViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/get-bookings')
      .then((res) => res.json())
      .then((data) => {
        setBookings(Array.isArray(data) ? (data as BookingViewModel[]) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center font-mono text-gray-400 italic">LOADING MAISON DATABASE...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto p-8 font-sans text-gray-900">
      <h1 className="text-3xl font-light tracking-tighter mb-10 uppercase border-b pb-4">Maison Intake</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {bookings.map((booking) => {
          const specs = booking.technicalSpecs || {};
          // DATA FIX: Measurements are inside 'attributes' based on your Debug log
          const attrs = specs.attributes || {}; 
          const prefs = specs.preferences || {};
          const isExpanded = expandedId === booking.id;

          const appointmentDate =
            [booking.appointmentDate, booking.appointmentTime].filter(Boolean).join(' @ ') || 'PENDING SCHEDULE';

          return (
            <div key={booking.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="p-6 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : booking.id)}>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{booking.email}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] text-gray-400 font-mono tracking-tighter">REF: {booking.id.toUpperCase()}</p>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        {appointmentDate}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-2xl text-gray-300 leading-none">{isExpanded ? '−' : '+'}</span>
                    <span className="px-3 py-1 bg-black text-white text-[10px] uppercase tracking-[0.2em] rounded-full font-bold">
                      {booking.fitPreference || prefs.fitType || 'NOT DEFINED'}
                    </span>
                    <Link
                      href={`/admin/fitting/${booking.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1 bg-emerald-700 text-white text-[10px] uppercase tracking-[0.2em] rounded-full font-bold hover:bg-emerald-800 transition-colors"
                    >
                      Tailor File →
                    </Link>
                  </div>
                </div>

                {/* VISUAL FIX: Pulling measurements from 'attrs' */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-6">
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Jacket / Trouser</p>
                    <p className="text-lg font-medium italic">J{booking.jacketSize || '—'} / T{booking.trouserSize || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Chest / Waist</p>
                    <p className="text-lg font-medium">{attrs.chest || '—'} / {attrs.waist || '—'}<span className="text-xs ml-1 text-gray-400">cm</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Stomach / Hips</p>
                    <p className="text-lg font-medium">{attrs.stomach || '—'} / {attrs.hips || '—'}<span className="text-xs ml-1 text-gray-400">cm</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Service Type</p>
                    <p className="text-lg font-medium">{booking.serviceType || 'Fitting'}</p>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-gray-50 border-t border-gray-200 p-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Workshop Anatomy - Showing as missing if not in DB */}
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-5">Workshop Anatomy</h3>
                      <div className="space-y-3 bg-white p-5 rounded-lg border border-gray-100 font-medium">
                        {[
                          { label: 'Body Build', val: attrs.bodyBuild },
                          { label: 'Standing Posture', val: attrs.standingPosture },
                          { label: 'Chest Profile', val: attrs.chestProfile },
                          { label: 'Stomach Profile', val: attrs.stomachProfile },
                          { label: 'Seat Shape', val: attrs.seatShape }
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-sm text-gray-500 font-normal">{item.label}</span>
                            <span className={`text-sm ${item.val ? 'text-gray-900 font-bold' : 'text-gray-300 italic'}`}>
                              {item.val || 'Data Missing from Form'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Project Scope */}
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-5">Project Scope</h3>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded border border-gray-100">
                            <p className="text-[10px] uppercase text-gray-400 font-bold mb-1 tracking-widest">Use Case</p>
                            <p className={`text-sm font-bold ${(attrs.useCase || prefs.primaryUseCase) ? 'text-gray-900' : 'text-gray-300 italic'}`}>
                              {attrs.useCase || prefs.primaryUseCase || 'Not Captured'}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded border border-gray-100">
                            <p className="text-[10px] uppercase text-gray-400 font-bold mb-1 tracking-widest">Timeline</p>
                            <p className={`text-sm font-bold ${(attrs.timeline || prefs.productionTimeline) ? 'text-blue-700' : 'text-gray-300 italic'}`}>
                              {attrs.timeline || prefs.productionTimeline || 'Not Captured'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white p-5 rounded-lg border-l-4 border-l-black border border-gray-100 shadow-sm">
                          <p className="text-[10px] uppercase text-gray-400 font-black mb-2 tracking-widest">Tailor Alerts / Notes</p>
                          <p className="text-sm text-gray-700 font-medium leading-relaxed italic">
                            {attrs.notes ? `"${attrs.notes}"` : 'No specific tailor alerts provided.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}