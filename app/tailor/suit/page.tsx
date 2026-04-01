'use client';

import Link from 'next/link';
import SuitConfiguratorController from '@/components/SuitConfiguratorController';

export default function SuitPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-serif uppercase tracking-wider text-gray-900 mb-2">
            Bespoke Suits
          </h1>
          <p className="text-lg text-gray-600">
            Design your perfect suit with our interactive configurator
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-block text-sm font-medium text-[#826300] hover:text-[#6a5100] underline"
          >
            Back to shop
          </Link>
        </header>

        {/* Configurator */}
        <div className="max-w-4xl mx-auto">
          <SuitConfiguratorController />
        </div>
      </div>
    </div>
  );
}
