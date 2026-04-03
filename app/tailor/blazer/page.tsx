import Link from 'next/link';
import CategoryConfiguratorController from '@/components/CategoryConfiguratorController';
import { blazerOptionSet } from '@/types/blazerOptions';

export const dynamic = 'force-dynamic';

export default function BlazerConfiguratorPage() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] py-10">
      <div className="mx-auto max-w-6xl px-4">
        <Link href="/shop" className="text-xs uppercase tracking-[0.16em] text-zinc-500 hover:text-zinc-800">
          Back to Shop
        </Link>
      </div>
      <CategoryConfiguratorController
        optionSet={blazerOptionSet}
        title="Blazer Configurator"
        intro="Build your custom blazer for business, smart casual, and occasion wear."
        basePrice={549}
        draftStorageKey="gj:draft:blazer:design"
      />
    </main>
  );
}
