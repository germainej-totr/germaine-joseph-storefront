import Link from 'next/link';
import { Suspense } from 'react';
import CategoryConfiguratorController from '@/components/CategoryConfiguratorController';
import { waistcoatOptionSet } from '@/types/waistcoatOptions';

export const dynamic = 'force-dynamic';

export default function WaistcoatConfiguratorPage() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] py-10">
      <div className="mx-auto max-w-6xl px-4">
        <Link href="/shop" className="text-xs uppercase tracking-[0.16em] text-zinc-500 hover:text-zinc-800">
          Back to Shop
        </Link>
      </div>
      <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8 text-sm text-zinc-500">Loading configurator...</div>}>
        <CategoryConfiguratorController
          optionSet={waistcoatOptionSet}
          title="Waistcoat Configurator"
          intro="Configure fit, neckline, pocket layout, and button finish for your waistcoat."
          basePrice={279}
          draftStorageKey="gj:draft:waistcoat:design"
        />
      </Suspense>
    </main>
  );
}
