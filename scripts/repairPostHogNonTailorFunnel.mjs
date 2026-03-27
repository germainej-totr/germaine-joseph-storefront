import 'dotenv/config';

const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY || process.env.POSTHOG_API_KEY || '';
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.posthog.com';
const TARGET_INSIGHT_NAME = 'Configurator Funnel: View -> Change -> Add to Cart';

if (!POSTHOG_API_KEY) {
  console.error('ERROR: POSTHOG_PERSONAL_API_KEY (or POSTHOG_API_KEY) is not set');
  process.exit(1);
}

async function api(path, options = {}) {
  const response = await fetch(`${POSTHOG_HOST}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${POSTHOG_API_KEY}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`PostHog API ${response.status} ${path}: ${text}`);
  }

  return body;
}

function buildFunnelQuery() {
  const events = [
    'gjm_non_tailor_config_view',
    'gjm_non_tailor_config_option_change',
    'gjm_non_tailor_config_add_to_cart',
  ];

  return {
    kind: 'FunnelsQuery',
    series: events.map((eventName) => ({
      kind: 'EventsNode',
      event: eventName,
      name: eventName,
      math: 'total',
    })),
    dateRange: {
      date_from: '-30d',
    },
    breakdown: 'product_handle',
  };
}

async function findTargetInsight() {
  const insights = await api('/api/projects/@current/insights/?limit=200');
  const results = insights?.results || [];
  return results.find((insight) => insight?.name === TARGET_INSIGHT_NAME) || null;
}

async function repairInsight(insightId) {
  const payload = {
    name: TARGET_INSIGHT_NAME,
    query: buildFunnelQuery(),
  };

  const updated = await api(`/api/projects/@current/insights/${insightId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return updated;
}

async function main() {
  console.log('Looking up target insight...');
  const target = await findTargetInsight();

  if (!target) {
    console.error(`Insight not found: ${TARGET_INSIGHT_NAME}`);
    console.log('Tip: run `npm run seed:posthog-dashboards` to recreate dashboard insights.');
    process.exit(1);
  }

  console.log(`Found insight id=${target.id}; repairing query payload...`);
  const updated = await repairInsight(target.id);

  const seriesCount = updated?.query?.series?.length || 0;
  const queryKind = updated?.query?.kind || 'unknown';

  console.log('Repair complete:');
  console.log(JSON.stringify({
    id: updated.id,
    name: updated.name,
    queryKind,
    seriesCount,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
