'use client';

import { calculateFitConfidence } from '@/lib/fit-logic';

interface BookingRecord {
  id: string;
  email: string;
  serviceType?: string;
  startAt: string | Date;
  location?: unknown;
  fitProfile?: Record<string, unknown> | null;
}

interface BookingsClientProps {
  initialBookings: BookingRecord[];
}

export default function BookingsClient({ initialBookings }: BookingsClientProps) {
  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-serif text-zinc-900">Tailor&apos;s Inbox</h1>
            <p className="text-zinc-500 mt-2 text-sm uppercase tracking-widest font-medium">
              Live Database: Germaine Joseph
            </p>
          </div>
          <div className="text-right">
            <span className="block text-2xl font-mono font-bold text-zinc-900">{initialBookings.length}</span>
            <span className="text-[10px] text-zinc-400 uppercase font-bold">Total Appointments</span>
          </div>
        </header>

        <div className="bg-white rounded-[2rem] shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Client / Email</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Service</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date/Time</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Fit Confidence</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialBookings.map((b) => {
                // Confidence logic uses the real fitProfile data from the database
                const confidence = b.fitProfile ? calculateFitConfidence(b.fitProfile) : 0;
                const city =
                  typeof b.location === 'object' &&
                  b.location !== null &&
                  'city' in b.location &&
                  typeof (b.location as { city?: unknown }).city === 'string'
                    ? ((b.location as { city?: string }).city ?? 'Melbourne')
                    : 'Melbourne';
                
                return (
                  <tr key={b.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-bold text-zinc-900">{b.email}</div>
                      <div className="text-[10px] font-mono text-zinc-400">ID: {b.id.substring(0,8)}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-medium text-zinc-800">{b.serviceType}</div>
                      <div className="text-xs text-zinc-500">{city}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-medium text-zinc-800">
                        {new Date(b.startAt).toLocaleDateString('en-AU')}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Date(b.startAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        confidence > 80 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {confidence > 0 ? `${confidence}%` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors">
                        View Analysis →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {initialBookings.length === 0 && (
            <div className="p-20 text-center text-zinc-400 italic">No bookings found in the database.</div>
          )}
        </div>
      </div>
    </div>
  );
}