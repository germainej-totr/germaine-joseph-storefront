import Link from 'next/link';
import CategoryConfiguratorController from '@/components/CategoryConfiguratorController';
import { overcoatOptionSet } from '@/types/overcoatOptions';

export const dynamic = 'force-dynamic';

export default function OvercoatConfiguratorPage() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] py-10">
      <div className="mx-auto max-w-6xl px-4">
        <Link href="/shop" className="text-xs uppercase tracking-[0.16em] text-zinc-500 hover:text-zinc-800">
          Back to Shop
        </Link>
      </div>
      <CategoryConfiguratorController
        optionSet={overcoatOptionSet}
        title="Overcoat Configurator"
        intro="Craft your overcoat silhouette, length, closure, and winter construction."
        basePrice={749}
        draftStorageKey="gj:draft:overcoat:design"
      />
    </main>
  );
}
