// components/AtelierSidebar.tsx
import React from 'react';

export default function AtelierSidebar({ currentSessionId }: { currentSessionId: string }) {
  return (
    <aside className="w-64 bg-black text-white p-8 flex flex-col justify-between min-h-screen">
      <div>
        <h2 className="text-xl font-bold mb-10 tracking-widest uppercase">Atelier</h2>
        <nav className="space-y-4">
          <a href={`/admin/fitting/${currentSessionId}`} className="block hover:text-[#826300]">Overview</a>
          <a href="#" className="block hover:text-[#826300]">Measurements</a>
          <a href="#" className="block hover:text-[#826300]">Production Specs</a>
        </nav>
      </div>
      <div className="text-xs text-gray-500">GJ v1.0 | Production Control</div>
    </aside>
  );
}