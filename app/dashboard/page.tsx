import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  // Fetch all sessions from the database
  const sessions = await db.fittingSession.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Atelier Dashboard</h1>
        <Link 
          href="/fitting/new" 
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          + New Manual Session
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{session.customerEmail}</td>
                <td className="px-6 py-4 text-sm text-gray-500">#{session.shopifyOrderId || 'Manual'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    session.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {session.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(session.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <Link href={`/fitting/${session.id}`} className="text-blue-600 hover:text-blue-900">
                    Edit Details
                  </Link>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No sessions found. Try making a test purchase or using the "Manual Session" button.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}