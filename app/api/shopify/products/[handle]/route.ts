// app/api/shopify/products/[handle]/route.ts
import { getProductByHandle } from "@/lib/shopify/queries";
import { handleApiError } from "@/lib/api-utils";
import { apiResponse } from "@/lib/utils";
import { z } from "zod";

const paramsSchema = z.object({ handle: z.string() });

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    // 1. Await params (Required for Next.js 15+)
    const resolvedParams = await params;

    // 2. Validation
    const { handle } = paramsSchema.parse(resolvedParams);

    // 3. Data Fetching via Query Orchestrator
    const product = await getProductByHandle(handle);
    
    // 4. Handle Empty State
    if (!product) {
      return apiResponse({ error: "Product not found" }, 404);
    }

    // 5. MTM Logic & Response
    return apiResponse({
      product,
      mtm: {
        required: product.mtm_required?.value === "true",
        category: product.mtm_category?.value,
      }
    });

  } catch (error) {
    // Standardized BFF Error Handling
    return handleApiError(error, "Product fetch failed");
  }
}