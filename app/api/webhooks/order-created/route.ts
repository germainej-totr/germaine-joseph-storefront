// app/api/webhooks/order-created/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  // Destructure and validate Environment Variables immediately
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!domain || !token) {
    console.error("❌ SETUP ERROR: Shopify Environment Variables are missing from .env");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const rawBody = await req.json();
    const { id: orderId, customer, email: orderEmail } = rawBody;
    
    const customerEmail = orderEmail || customer?.email;

    if (!customerEmail) {
      return NextResponse.json({ message: "No email found in webhook payload" }, { status: 200 });
    }

    // 1. Fetch the latest Fit Measurements from your Postgres Vault
    const latestFit = await prisma.fitProfile.findUnique({
      where: { email: customerEmail },
      include: {
        measurements: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!latestFit || latestFit.measurements.length === 0) {
      console.log(`No measurements found for ${customerEmail}`);
      return NextResponse.json({ message: "No measurements to attach" }, { status: 200 });
    }

    const measurements = latestFit.measurements[0].data as Record<string, any>;
    
    // 2. Format the measurements into a clean string for the Workshop
    const noteContent = Object.entries(measurements)
      .map(([key, val]) => `${key.toUpperCase()}: ${val}cm`)
      .join('\n');

    const workshopNote = `--- MAISON ANATOMICAL DATA ---\n${noteContent}\n----------------------------`;

    // 3. Write this data back to the Shopify Order using the verified domain and token
    const shopifyResponse = await fetch(`https://${domain}/admin/api/2024-01/orders/${orderId}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({
        order: {
          id: orderId,
          note: workshopNote
        }
      })
    });

    // Handle case where Shopify Order ID doesn't exist (common in testing)
    if (!shopifyResponse.ok) {
       console.warn(`⚠️ Shopify update failed: ${shopifyResponse.status}. Likely a mock Order ID.`);
    }

    // 4. Record this in your ProductionSpec table for internal tracking
    await prisma.productionSpec.create({
      data: {
        orderId: orderId.toString(),
        fitProfileId: latestFit.id,
        spec: measurements,
        status: shopifyResponse.ok ? "synced_to_shopify" : "db_lookup_success_shopify_fail"
      }
    });

    return NextResponse.json({ 
        message: "Webhook processed", 
        shopifyStatus: shopifyResponse.status 
    }, { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}