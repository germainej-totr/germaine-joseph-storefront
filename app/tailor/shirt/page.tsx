import Link from 'next/link';
import { Suspense } from 'react';
import CategoryConfiguratorController from '@/components/CategoryConfiguratorController';
import { shirtOptionSet } from '@/types/shirtOptions';

export const dynamic = 'force-dynamic';

export default function ShirtConfiguratorPage() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] py-10">
      <div className="mx-auto max-w-6xl px-4">
        <Link href="/shop" className="text-xs uppercase tracking-[0.16em] text-zinc-500 hover:text-zinc-800">
          Back to Shop
        </Link>
      </div>
      <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8 text-sm text-zinc-500">Loading configurator...</div>}>
        <CategoryConfiguratorController
          optionSet={shirtOptionSet}
          title="Shirt Configurator"
          intro="Design your shirt collar, cuff, placket, and finish details."
          basePrice={169}
          draftStorageKey="gj:draft:shirt:design"
        />
      </Suspense>
    </main>
  );
}
