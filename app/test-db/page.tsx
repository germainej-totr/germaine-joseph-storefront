import { db } from "@/lib/db";

export default async function TestDBPage() {
  // 1. Fetch all fitting sessions from your SQLite database
  const sessions = await db.fittingSession.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-10 font-mono bg-gray-50 min-h-screen">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-blue-600">🛠️ Database Debugger</h1>
        <p className="text-gray-600">Checking: <code>prisma/dev.db</code></p>
      </header>

      <div className="mb-6">
        <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
          Sessions Found: {sessions.length}
        </span>
      </div>
      
      <div className="grid gap-6">
        {sessions.map((session) => (
          <div key={session.id} className="p-5 border rounded-xl bg-white shadow-md border-gray-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <span className="font-bold text-lg text-slate-800">{session.customerEmail}</span>
              <span className="text-xs font-semibold uppercase bg-gray-100 px-2 py-1 rounded text-gray-500">
                {session.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
              <p><strong>ID:</strong> {session.id.substring(0, 8)}...</p>
              <p><strong>Order:</strong> {session.shopifyOrderId || "N/A"}</p>
              <p><strong>Created:</strong> {new Date(session.createdAt).toLocaleString()}</p>
            </div>

            <p className="text-xs font-bold text-gray-400 mb-1">RAW JSON DATA:</p>
            <pre className="text-[10px] bg-slate-900 text-emerald-400 p-4 rounded-lg overflow-x-auto leading-relaxed">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        ))}
      </div>
      
      {sessions.length === 0 && (
        <div className="p-12 border-4 border-dashed border-gray-200 rounded-2xl text-center bg-white">
          <p className="text-xl text-gray-400 font-medium mb-4">The database is currently empty.</p>
          <div className="bg-slate-100 p-4 rounded-lg inline-block text-left">
            <p className="text-xs font-bold text-slate-500 mb-2">RUN THIS IN YOUR TERMINAL TO ADD DATA:</p>
            <code className="text-blue-600 text-sm">
              shopify app webhook trigger --topic orders/paid --address [YOUR-TUNNEL-URL]/api/webhooks/shopify/order-paid
            </code>
          </div>
        </div>
      )}
    </div>
  );
}