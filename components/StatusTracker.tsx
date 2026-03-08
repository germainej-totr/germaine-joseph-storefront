// components/StatusTracker.tsx
import React from 'react';

const STATUSES = ['DRAFT', 'ORDERED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'];

export default function StatusTracker({ currentStatus }: { currentStatus: string }) {
  return (
    <div className="flex space-x-2">
      {STATUSES.map((status) => (
        <span 
          key={status}
          className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${
            status === currentStatus ? 'bg-[#826300] text-white' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {status}
        </span>
      ))}
    </div>
  );
}