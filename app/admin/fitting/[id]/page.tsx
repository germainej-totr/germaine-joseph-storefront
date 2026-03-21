import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import FittingForm from "@/components/FittingForm";
import AtelierSidebar from "@/components/AtelierSidebar";
import StatusTracker from "@/components/StatusTracker";
import { FittingStatus } from "@prisma/client";

export default async function FittingDashboardPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  // [id] is the FitProfile.id
  const profile = await db.fitProfile.findUnique({
    where: { id },
    include: {
      fittingSessions: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!profile) notFound();

  // Use the linked session if it exists; otherwise scaffold from the profile
  const session = profile.fittingSessions[0] ?? {
    id: null,
    shopifyOrderId: null,
    customerEmail: profile.email,
    productionLine: "",
    jacketBaseBlock: profile.jacketSize ?? "",
    trouserBaseBlock: profile.trouserSize ?? "",
    masterFitType: profile.fitPreference ?? "",
    measurements: {},
    tailorName: "",
    status: FittingStatus.DRAFT,
    fitProfileId: profile.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <div className="flex min-h-screen bg-[#F1EFEC]">
      <AtelierSidebar currentSessionId={id} />

      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8 border-b border-gray-300 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase text-black">Germaine Joseph</h1>
            <p className="text-sm text-gray-600">
              Unified Tailors Dashboard | {profile.email}
              {session.shopifyOrderId ? ` | Order #${session.shopifyOrderId}` : ''}
            </p>
          </div>
          <StatusTracker currentStatus={session.status} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <FittingForm initialData={session} />
          </div>
          <aside className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="font-bold mb-4 uppercase text-sm">Client Profile</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold uppercase text-[10px] text-gray-400 tracking-widest block">Email</span>{profile.email}</p>
              <p><span className="font-semibold uppercase text-[10px] text-gray-400 tracking-widest block">Fit</span>{profile.fitPreference || '—'}</p>
              <p><span className="font-semibold uppercase text-[10px] text-gray-400 tracking-widest block">Blocks</span>J{profile.jacketSize || '—'} / T{profile.trouserSize || '—'}</p>
              <p><span className="font-semibold uppercase text-[10px] text-gray-400 tracking-widest block">Appointment</span>
                {[profile.appointmentDate, profile.appointmentTime].filter(Boolean).join(' @ ') || 'Pending'}
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}