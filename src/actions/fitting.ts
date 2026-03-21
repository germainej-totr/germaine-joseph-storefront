"use server";

import { db } from "@/lib/db";
import { FittingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * 1. Define the validation schema
 */
const FittingSessionSchema = z.object({
  customerEmail: z.string().email("Invalid email address"),
  productionLine: z.string().min(1, "Production line is required"),
  jacketBaseBlock: z.string().optional(),
  trouserBaseBlock: z.string().optional(),
  masterFitType: z.string().optional(),
  measurements: z.record(z.string(), z.union([z.string(), z.number()])),
  tailorName: z.string().optional().default("Atelier Lead"),
  shopifyOrderId: z.string().optional(),
});

/**
 * Upserts a fitting session. Validates input via Zod and links to FitProfile.
 */
export async function upsertFittingSession(rawData: unknown) {
  try {
    const validatedData = FittingSessionSchema.parse(rawData);
    const shopifyOrderId =
      validatedData.shopifyOrderId ??
      `manual-${validatedData.customerEmail.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;

    // 2. Find existing FitProfile to establish the relationship
    const existingProfile = await db.fitProfile.findUnique({
      where: { email: validatedData.customerEmail },
    });

    // 3. Perform Upsert
    const session = await db.fittingSession.upsert({
      where: { 
        shopifyOrderId
      },
      update: {
        measurements: validatedData.measurements,
        status: FittingStatus.DRAFT,
        productionLine: validatedData.productionLine,
      },
      create: {
        customerEmail: validatedData.customerEmail,
        productionLine: validatedData.productionLine,
        
        // Asserting types to bypass strict TypeScript interface checks
        jacketBaseBlock: (validatedData.jacketBaseBlock ?? null) as string | null,
        trouserBaseBlock: (validatedData.trouserBaseBlock ?? null) as string | null,
        masterFitType: (validatedData.masterFitType ?? null) as string | null,
        
        measurements: validatedData.measurements,
        tailorName: validatedData.tailorName,
        shopifyOrderId,
        status: FittingStatus.DRAFT,
        
        ...(existingProfile && {
          fitProfile: { connect: { id: existingProfile.id } },
        }),
      },
    });

    revalidatePath("/admin/fitting");

    return { 
      success: true, 
      sessionId: session.id,
      linkedToProfile: !!existingProfile 
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", details: error.flatten().fieldErrors };
    }
    console.error("Atelier Save Error:", error);
    return { success: false, error: "Database operation failed." };
  }
}

/**
 * Retrieves a session for the tailor dashboard.
 */
export async function getFittingSession(id: string) {
  return await db.fittingSession.findUnique({
    where: { id },
    include: { fitProfile: true },
  });
}