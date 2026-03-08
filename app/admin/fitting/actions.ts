"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { FittingStatus } from "@prisma/client"; // Import the Enum for strict validation

/**
 * Updates the lifecycle status of a fitting session.
 * This function is called by the StatusToggle Client Component.
 */
export async function updateStatus(id: string, status: string) {
  // Convert the incoming string to the strict Enum type
  const statusEnum = status as FittingStatus;

  // Update the database record with the new status
  await db.fittingSession.update({
    where: { id },
    data: { 
      status: statusEnum,
      updatedAt: new Date() // Force an update to the timestamp for the 6-month logic
    },
  });
  
  // Refresh the dashboard data so the UI reflects the change immediately 
  // without requiring a full page reload
  revalidatePath("/admin/fitting");
}