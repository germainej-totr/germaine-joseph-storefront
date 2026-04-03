import Link from 'next/link';
import SuitConfiguratorController from '@/components/SuitConfiguratorController';

export const dynamic = 'force-dynamic';

export default function TuxedoConfiguratorPage() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] py-10">
      <div className="mx-auto max-w-6xl px-4">
        <Link href="/shop" className="text-xs uppercase tracking-[0.16em] text-zinc-500 hover:text-zinc-800">
          Back to Shop
        </Link>
      </div>
      <SuitConfiguratorController
        initialVariant="tuxedo"
        showVariantSelector={false}
        basePrice={899}
      />
    </main>
  );
}
