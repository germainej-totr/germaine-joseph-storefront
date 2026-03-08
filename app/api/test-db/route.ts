import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Ensure this matches your standard import

export async function GET() {
  try {
    // 1. Verify connection by counting sessions
    const count = await db.fittingSession.count();
    
    // 2. Perform upsert using 'db' instance
    const testUser = await db.fitProfile.upsert({
      where: { email: 'bespoke-test@germainejoseph.com' },
      update: {},
      create: {
        email: 'bespoke-test@germainejoseph.com'
      },
    });

    return NextResponse.json({ 
      status: "Success", 
      message: "Anatomical Vault is connected", 
      sessionCount: count,
      user: testUser 
    });
  } catch (error: any) {
    console.error("DEBUG_DB_ERROR:", error);
    return NextResponse.json({ 
      status: "Error", 
      message: error.message 
    }, { status: 500 });
  }
}