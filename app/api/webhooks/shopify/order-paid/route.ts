import { NextResponse } from "next/server";
import { upsertFittingSession } from "@/actions/fitting";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    // 2. HMAC Verification (Keep commented out for local testing if needed)
    /*
    const generatedHash = crypto
      .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
      .update(rawBody, "utf8")
      .digest("base64");

    if (generatedHash !== hmacHeader) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    */

    const body = JSON.parse(rawBody);

    // 3. Extract and map data to your action schema
    const sessionData = {
      customerEmail: body.customer?.email || "unknown@example.com",
      shopifyOrderId: body.id?.toString() || `TEST-${Date.now()}`,
      productionLine: body.line_items?.[0]?.title || "standard_suit",
      jacketBaseBlock: "PENDING",
      trouserBaseBlock: "PENDING",
      masterFitType: "REGULAR",
      // Ensure this is a valid record according to your Zod schema
      measurements: { status: "pending" }, 
      tailorName: "Shopify System",
    };

    // 4. Call your validated action with debug logging
    console.log("DEBUG: Sending to Action:", JSON.stringify(sessionData, null, 2));
    const result = await upsertFittingSession(sessionData);

    if (!result.success) {
      console.error("Action Error:", result.error);
      // If validation details exist (Zod errors), log them specifically
      if ('details' in result) {
          console.error("Validation Details:", result.details);
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log("✅ Success: Fitting session created with ID:", result.sessionId);

    return NextResponse.json({ 
        success: true, 
        message: "Fitting session initialized", 
        id: result.sessionId 
    });

  } catch (error) {
    console.error("WEBHOOK_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}