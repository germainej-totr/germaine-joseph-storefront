// app/tailor/jacket/page.tsx
import { getMeasurementGuide } from '@/lib/shopify-admin';
import SmartFitForm from '@/components/tailor/SmartFitForm';

export const dynamic = 'force-dynamic';

export default async function JacketFittingPage() {
  // 1. Fetch technical rules at request time to avoid build-time Shopify dependency failures.
  let guide: Awaited<ReturnType<typeof getMeasurementGuide>> | null = null;
  try {
    guide = await getMeasurementGuide('jacket');
  } catch {
    guide = null;
  }

  // 2. Mock User (In production, get this from your Auth session)
  const userEmail = "client@example.com";

  if (!guide) {
    return <div className="p-10 text-stone-500">Loading Maison rules...</div>;
  }

  return (
    <main className="min-h-screen bg-stone-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-serif tracking-widest uppercase">The Digital Tailor</h1>
          <p className="text-stone-500 mt-2 italic">Precision measurements for a Germaine Joseph fit.</p>
        </header>

        {/* The component we built, now powered by real Shopify data */}
        <SmartFitForm 
          guide={guide} 
          category="Jacket" 
          userEmail={userEmail} 
        />
      </div>
    </main>
  );
}