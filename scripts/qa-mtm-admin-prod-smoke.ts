import 'dotenv/config';

const PROD_BASE_URL = (
  process.env.LAUNCH_BASE_URL || process.env.RUNTIME_BASE_URL || 'https://germaine-joseph-storefront.vercel.app'
).replace(/\/$/, '');

function extractOrderIdFromHtml(html: string) {
  const routeMatch = html.match(/\/admin\/mtm-orders\/([A-Za-z0-9_-]+)/);
  if (routeMatch?.[1]) {
    return routeMatch[1];
  }

  const uuidMatch = html.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  return uuidMatch?.[0] ?? null;
}

async function main() {
  const explicitId = process.argv[2]?.trim();
  let orderId = explicitId || null;

  if (!orderId) {
    const listResponse = await fetch(`${PROD_BASE_URL}/admin/mtm-orders`, {
      redirect: 'manual',
    });

    console.log(`list_status=${listResponse.status}`);

    const listHtml = await listResponse.text();
    orderId = extractOrderIdFromHtml(listHtml);
  }

  if (!orderId) {
    console.log('order_id=none');
    console.log('detail_status=skipped');
    console.log('spec_status=skipped');
    return;
  }

  console.log(`order_id=${orderId}`);

  const detailUrl = `${PROD_BASE_URL}/admin/mtm-orders/${orderId}`;
  const specUrl = `${PROD_BASE_URL}/api/admin/mtm-orders/${orderId}/spec`;

  const detailResponse = await fetch(detailUrl, {
    redirect: 'manual',
  });

  console.log(`detail_status=${detailResponse.status} id=${orderId}`);

  const specResponse = await fetch(specUrl, {
    redirect: 'manual',
  });

  console.log(`spec_status=${specResponse.status} id=${orderId}`);
  console.log(`spec_content_type=${specResponse.headers.get('content-type') ?? ''}`);
  console.log(`spec_content_disposition=${specResponse.headers.get('content-disposition') ?? ''}`);

  if (specResponse.ok) {
    const body = await specResponse.json();
    console.log(`spec_top_level_keys=${Object.keys(body).join(',')}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });