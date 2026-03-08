import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import FittingForm from "@/components/FittingForm";
import AtelierSidebar from "@/components/AtelierSidebar"; // New Navigation Component
import StatusTracker from "@/components/StatusTracker"; // New Status UI

export default async function FittingDashboardPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  
  const session = await db.fittingSession.findUnique({
    where: { id: id },
    include: { fitProfile: true } // Fetch related profile data
  });

  if (!session) notFound();

  return (
    <div className="flex min-h-screen bg-[#F1EFEC]">
      <AtelierSidebar currentSessionId={id} />
      
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8 border-b border-gray-300 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase text-black">Germaine Joseph</h1>
            <p className="text-sm text-gray-600">Unified Tailors Dashboard | Order #{session.shopifyOrderId}</p>
          </div>
          <StatusTracker currentStatus={session.status} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <FittingForm initialData={session} />
          </div>
          <aside className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="font-bold mb-4 uppercase text-sm">Client Profile</h2>
            {/* Additional contextual widgets go here */}
          </aside>
        </div>
      </main>
    </div>
  );
}