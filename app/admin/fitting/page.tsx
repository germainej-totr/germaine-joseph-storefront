import { db } from "@/lib/db";
import Link from "next/link";

export default async function AdminDashboard() {
  const appointments = await db.fitProfile.findMany({
    where: {
      OR: [
        { appointmentDate: { not: null } },
        { appointmentTime: { not: null } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    include: { fittingSessions: { orderBy: { createdAt: 'desc' }, take: 1 } },
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
            <th style={{ padding: "12px" }}>Appointment</th>
            <th style={{ padding: "12px" }}>Fit Type</th>
            <th style={{ padding: "12px" }}>Blocks</th>
            <th style={{ padding: "12px" }}>Service Mode</th>
            <th style={{ padding: "12px" }}>Last Update</th>
            <th style={{ padding: "12px" }}>Action</th>
            <th style={{ padding: "12px" }}>Tailor File</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((profile) => {
            const needsRefit = new Date(profile.updatedAt) < sixMonthsAgo;
            const technical = (profile.technicalSpecs ?? {}) as {
              attributes?: { appointmentMode?: string; onLocationAddress?: string };
            };
            const appointmentMode = technical.attributes?.appointmentMode || "Studio";
            const appointmentLabel = [profile.appointmentDate, profile.appointmentTime]
              .filter(Boolean)
              .join(" @ ") || "Pending schedule";
            
            return (
              <tr key={profile.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px" }}>
                  <div style={{ fontWeight: "500" }}>{profile.email}</div>
                  {needsRefit && (
                    <div style={{ fontSize: "10px", color: "#d93025", fontWeight: "bold", marginTop: "4px" }}>
                      ⚠️ RE-FITTING REQUIRED (6MO+)
                    </div>
                  )}
                </td>
                <td style={{ padding: "12px", fontSize: "13px" }}>{appointmentLabel}</td>
                <td style={{ padding: "12px" }}>{profile.fitPreference || "Not set"}</td>
                <td style={{ padding: "12px" }}>
                  J{profile.jacketSize || "-"} / T{profile.trouserSize || "-"}
                </td>
                <td style={{ padding: "12px" }}>{appointmentMode}</td>

                <td style={{ padding: "12px", fontSize: "13px" }}>
                  {new Date(profile.updatedAt).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </td>

                <td style={{ padding: "12px" }}>
                  {needsRefit ? (
                    <span style={{ color: "#d93025", fontSize: "11px", fontWeight: "bold" }}>Follow-up needed</span>
                  ) : (
                    <span style={{ color: "#999", fontSize: "11px" }}>In Window</span>
                  )}
                </td>

                <td style={{ padding: "12px" }}>
                  <Link href={`/admin/appointments`} style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold", fontSize: "14px" }}>
                    Open Intake →
                  </Link>
                </td>

                <td style={{ padding: "12px" }}>
                  <Link
                    href={`/admin/fitting/${profile.id}`}
                    style={{ color: "#2d6a4f", textDecoration: "none", fontWeight: "bold", fontSize: "14px" }}
                  >
                    Tailor File →
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