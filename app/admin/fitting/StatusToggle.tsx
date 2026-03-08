"use client";

import { updateStatus } from "./actions";
import { useRouter } from "next/navigation"; 

export default function StatusToggle({ id, status }: { id: string, status: string }) {
  const router = useRouter(); 

  return (
    <select 
      defaultValue={status}
      onChange={async (e) => {
        // Trigger the server action
        await updateStatus(id, e.target.value);
        // Force the page to re-fetch data so the UI updates instantly
        router.refresh(); 
      }}
      style={{
        padding: "6px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontSize: "13px",
        backgroundColor: status === "DELIVERED" ? "#f0f0f0" : "white",
        cursor: "pointer",
        fontWeight: status === "DELIVERED" ? "normal" : "bold"
      }}
    >
      <option value="DRAFT">Draft</option>
      <option value="ORDERED">Ordered</option>
      <option value="IN_PRODUCTION">In Production</option>
      <option value="SHIPPED">Shipped</option>
      <option value="DELIVERED">Delivered (Closed)</option>
    </select>
  );
}