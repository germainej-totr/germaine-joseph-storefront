// app/api/webhooks/order-created/route.ts
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { captureMtmFunnelEvent } from '@/lib/analytics/captureMtmFunnelEvent';

type ShopifyLineItemProperty = {
  name?: string;
  key?: string;
  value?: unknown;
};

type ShopifyLineItem = {
  id?: number | string;
  title?: string;
  properties?: ShopifyLineItemProperty[];
};

type ShopifyOrderWebhookPayload = {
  id?: number | string;
  customer?: { email?: string };
  email?: string;
  line_items?: ShopifyLineItem[];
};

type ProductionSpecCandidate = {
  fitProfileId: string;
  spec: Prisma.InputJsonValue;
  workshopNote: string;
  status: string;
};

function safeParseJson(value: unknown): unknown {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toPropertyMap(properties: ShopifyLineItemProperty[] | undefined): Record<string, string> {
  const entries = (properties || [])
    .map((property) => {
      const key = property.key || property.name;
      const value = property.value;
      if (!key || typeof value !== 'string') {
        return null;
      }

      return [key, value] as const;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry));

  return Object.fromEntries(entries);
}

function buildWorkshopNote(measurements: Record<string, unknown>): string {
  const noteContent = Object.entries(measurements)
    .map(([key, value]) => `${key.toUpperCase()}: ${String(value)}cm`)
    .join('\n');

  if (!noteContent) {
    return '--- MAISON ANATOMICAL DATA ---\nNo measurement data captured\n----------------------------';
  }

  return `--- MAISON ANATOMICAL DATA ---\n${noteContent}\n----------------------------`;
}

function extractMeasurementsFromSpec(spec: Record<string, unknown>): Record<string, unknown> {
  const specMeasurements = spec.measurements;
  if (specMeasurements && typeof specMeasurements === 'object' && !Array.isArray(specMeasurements)) {
    return specMeasurements as Record<string, unknown>;
  }

  return {};
}

function buildProductionSpecCandidateFromLineItem(lineItem: ShopifyLineItem): ProductionSpecCandidate | null {
  const propertyMap = toPropertyMap(lineItem.properties);
  const fitProfileId = propertyMap.gjm_fit_profile_id || propertyMap.fit_profile_id || '';
  if (!fitProfileId) {
    return null;
  }

  const mtmSpec = safeParseJson(propertyMap.gjm_mtm_spec);
  const mtmCanonical = safeParseJson(propertyMap.gjm_mtm_canonical);
  const mtmOptions = safeParseJson(propertyMap.gjm_mtm_options);
  const measurements = safeParseJson(propertyMap.gjm_measurements);

  const specSource =
    (mtmCanonical && typeof mtmCanonical === 'object' && !Array.isArray(mtmCanonical) && mtmCanonical) ||
    (mtmSpec && typeof mtmSpec === 'object' && !Array.isArray(mtmSpec) && mtmSpec) ||
    null;

  const baseSpec = (specSource || {}) as Record<string, unknown>;
  const normalizedSpec: Record<string, unknown> = {
    ...baseSpec,
    orderLineItemId: lineItem.id ? String(lineItem.id) : undefined,
    orderLineItemTitle: lineItem.title || undefined,
    fitProfileId,
    mtmCategory:
      propertyMap.gjm_mtm_category ||
      propertyMap.mtm_category ||
      String(baseSpec.category || ''),
    options:
      (mtmOptions && typeof mtmOptions === 'object' && !Array.isArray(mtmOptions) ? mtmOptions : undefined) ||
      (baseSpec.options && typeof baseSpec.options === 'object' && !Array.isArray(baseSpec.options)
        ? baseSpec.options
        : undefined) ||
      {},
    measurements:
      (measurements && typeof measurements === 'object' && !Array.isArray(measurements) ? measurements : undefined) ||
      extractMeasurementsFromSpec(baseSpec),
    gjmAttributes: propertyMap,
  };

  const workshopMeasurements = extractMeasurementsFromSpec(normalizedSpec);

  return {
    fitProfileId,
    spec: normalizedSpec as Prisma.InputJsonValue,
    workshopNote: buildWorkshopNote(workshopMeasurements),
    status: 'line_item_snapshot_recorded',
  };
}

export async function POST(req: Request) {
  // Destructure and validate Environment Variables immediately
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!domain || !token) {
    console.error("❌ SETUP ERROR: Shopify Environment Variables are missing from .env");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const rawBody = (await req.json()) as ShopifyOrderWebhookPayload;
    const { id: orderId, customer, email: orderEmail } = rawBody;
    
    const customerEmail = orderEmail || customer?.email;

    if (!customerEmail) {
      return NextResponse.json({ message: "No email found in webhook payload" }, { status: 200 });
    }

    const lineItemCandidates = (rawBody.line_items || [])
      .map((lineItem) => buildProductionSpecCandidateFromLineItem(lineItem))
      .filter((candidate): candidate is ProductionSpecCandidate => Boolean(candidate));

    let productionSpecs = lineItemCandidates;

    if (!productionSpecs.length) {
      const latestFit = await prisma.fitProfile.findUnique({
        where: { email: customerEmail },
        include: {
          measurements: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!latestFit || latestFit.measurements.length === 0) {
        console.log(`No MTM line item attributes or measurements found for ${customerEmail}`);
        return NextResponse.json({ message: 'No measurements to attach' }, { status: 200 });
      }

      const measurements = latestFit.measurements[0].data as Record<string, unknown>;
      productionSpecs = [
        {
          fitProfileId: latestFit.id,
          spec: {
            fitProfileId: latestFit.id,
            source: 'fit_profile_fallback',
            email: customerEmail,
            measurements,
          } as Prisma.InputJsonValue,
          workshopNote: buildWorkshopNote(measurements),
          status: 'fit_profile_fallback_recorded',
        },
      ];
    }

    const workshopNote = productionSpecs.map((candidate) => candidate.workshopNote).join('\n\n');

    // 3. Write the workshop note back to Shopify.
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

    // 4. Record immutable production specs for each MTM line item snapshot.
    await prisma.productionSpec.createMany({
      data: productionSpecs.map((candidate) => ({
        orderId: String(orderId),
        fitProfileId: candidate.fitProfileId,
        spec: candidate.spec,
        status: shopifyResponse.ok ? 'synced_to_shopify' : candidate.status,
      })),
    });

    await Promise.all(
      productionSpecs.map((candidate) => {
        const spec = candidate.spec as Record<string, unknown>;
        return captureMtmFunnelEvent({
          event_name: 'gjm_mtm_order_completed',
          occurred_at: new Date().toISOString(),
          order_id: String(orderId),
          customer_id: customerEmail,
          fit_profile_id: candidate.fitProfileId,
          mtm_category: String(spec.mtmCategory || spec.category || 'mtm'),
          funnel_step: 'order_completed',
          source: 'webhooks/order-created',
        }).catch((error) => {
          console.error('gjm_mtm_order_completed event emit failed:', error);
        });
      }),
    );

    return NextResponse.json({ 
        message: 'Webhook processed', 
        productionSpecCount: productionSpecs.length,
        shopifyStatus: shopifyResponse.status 
    }, { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}