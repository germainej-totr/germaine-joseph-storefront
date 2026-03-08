import { db } from "@/lib/db";
import Link from "next/link";
import StatusToggle from "./StatusToggle";

export default async function AdminDashboard() {
  const sessions = await db.fittingSession.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "30px", borderBottom: "2px solid #eee", paddingBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Atelier Master Dashboard</h1>
        <p style={{ color: "#666" }}>Manage customer lifecycle, production stages, and CRM outreach</p>
      </header>

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
            <th style={{ padding: "12px" }}>Customer</th>
            <th style={{ padding: "12px" }}>Order ID</th>
            <th style={{ padding: "12px" }}>Product</th>
            <th style={{ padding: "12px" }}>Lifecycle Status</th>
            <th style={{ padding: "12px" }}>Last Fitting</th>
            <th style={{ padding: "12px" }}>CRM Action</th>
            <th style={{ padding: "12px" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => {
            const needsRefit = new Date(session.updatedAt) < sixMonthsAgo;
            
            return (
              <tr key={session.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px" }}>
                  <div style={{ fontWeight: "500" }}>{session.customerEmail}</div>
                  {needsRefit && (
                    <div style={{ fontSize: "10px", color: "#d93025", fontWeight: "bold", marginTop: "4px" }}>
                      ⚠️ RE-FITTING REQUIRED (6MO+)
                    </div>
                  )}
                </td>
                <td style={{ padding: "12px" }}>#{(session.shopifyOrderId ?? "00000").slice(-5)}</td>
                <td style={{ padding: "12px" }}>{session.productionLine}</td>
                
                {/* INTERACTIVE TOGGLE COMPONENT */}
                <td style={{ padding: "12px" }}>
                  <StatusToggle id={session.id} status={session.status as string} />
                </td>

                <td style={{ padding: "12px", fontSize: "13px" }}>
                  {new Date(session.updatedAt).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </td>

                <td style={{ padding: "12px" }}>
                  {needsRefit ? (
                    <button 
                      onClick={() => alert(`Emailing ${session.customerEmail} check-in link...`)}
                      style={{ padding: "6px 10px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}
                    >
                      SEND CHECK-IN
                    </button>
                  ) : (
                    <span style={{ color: "#999", fontSize: "11px" }}>In Window</span>
                  )}
                </td>

                <td style={{ padding: "12px" }}>
                  <Link href={`/admin/fitting/${session.id}`} style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold", fontSize: "14px" }}>
                    Open Fitting →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}