/**
 * PostHog Dashboard Seeder
 *
 * This script programmatically creates the Non-Tailor Configurator dashboard
 * and all its insights in PostHog using the REST API.
 *
 * Usage:
 * 1. Set POSTHOG_PERSONAL_API_KEY (or POSTHOG_API_KEY) and POSTHOG_HOST env vars
 * 2. Run: node scripts/seedPostHogDashboard.mjs
 *
 * Prerequisites:
 * - PostHog account with API access
 * - API key from PostHog settings (https://app.posthog.com/settings/project-api-keys)
 */

const NON_TAILOR_CONFIGURATOR_DASHBOARD_PACK = {
  id: 'gjm-non-tailor-config-v1',
  name: 'GJM Non-Tailor Configurator Funnel',
  description:
    'Conversion and engagement tracking for shoes, leather goods, and other non-tailor configurable categories.',
  blocks: [
    {
      key: 'config_view_to_add_funnel',
      title: 'Configurator Funnel: View -> Change -> Add to Cart',
      insightType: 'Funnel',
      question: 'What is the drop-off rate through the non-tailor configurator flow?',
      events: [
        'gjm_non_tailor_config_view',
        'gjm_non_tailor_config_option_change',
        'gjm_non_tailor_config_add_to_cart',
      ],
      breakdowns: ['product_handle', 'mtm_category'],
    },
    {
      key: 'config_view_trends',
      title: 'Configurator View Trends',
      insightType: 'Trends',
      question: 'How many users are arriving at non-tailor configurable product pages?',
      events: ['gjm_non_tailor_config_view'],
      breakdowns: ['mtm_category', 'product_type', 'product_handle'],
    },
    {
      key: 'option_change_frequency',
      title: 'Option Change Frequency',
      insightType: 'Trends',
      question: 'How often do users interact with configurator options?',
      events: ['gjm_non_tailor_config_option_change'],
      breakdowns: ['option_name', 'mtm_category', 'product_handle'],
    },
    {
      key: 'config_to_cart_conversion',
      title: 'View to Add-to-Cart Conversion Rate',
      insightType: 'Funnel',
      question: 'What percentage of users who view the configurator add to cart?',
      events: ['gjm_non_tailor_config_view', 'gjm_non_tailor_config_add_to_cart'],
      formula: 'gjm_non_tailor_config_add_to_cart / gjm_non_tailor_config_view',
      breakdowns: ['mtm_category', 'product_handle'],
    },
    {
      key: 'custom_notes_adoption',
      title: 'Custom Notes Adoption Rate',
      insightType: 'Trends',
      question: 'How often do users include custom notes in configurator orders?',
      events: ['gjm_non_tailor_config_add_to_cart'],
      filters: [
        {
          property: 'custom_notes_present',
          operator: '=',
          value: 'true',
        },
      ],
      breakdowns: ['mtm_category', 'product_handle'],
    },
    {
      key: 'avg_options_selected_per_cart_add',
      title: 'Average Options Selected Per Add',
      insightType: 'Trends',
      question: 'On average, how many options are configured when users add to cart?',
      events: ['gjm_non_tailor_config_add_to_cart'],
      formula: 'SUM(selected_options_count) / COUNT(*)',
      breakdowns: ['mtm_category', 'product_handle'],
    },
  ],
};

const MTM_GATE_DASHBOARD_PACK = {
  id: 'gjm-mtm-gate-v1',
  name: 'GJM MTM Gate Performance',
  description:
    'Decision and action visibility for product-level MTM gating across MTM-required catalogue products.',
  blocks: [
    {
      key: 'gate_decision_mix',
      title: 'Gate Decision Mix',
      insightType: 'Trends',
      question: 'How are users distributed across MTM gate decision outcomes?',
      events: [
        'gjm_gate_full_mtm_required',
        'gjm_gate_saved_fit_eligible',
        'gjm_gate_refit_recommended',
        'gjm_gate_unauthenticated',
        'gjm_gate_profile_not_owned',
      ],
      breakdowns: ['mtm_category', 'product_handle'],
    },
    {
      key: 'saved_fit_acceptance_rate',
      title: 'Saved-Fit Acceptance Rate',
      insightType: 'Funnel',
      question: 'When users are saved-fit eligible, how many choose to use saved fit?',
      events: ['gjm_gate_saved_fit_eligible', 'gjm_use_saved_fit_clicked'],
      formula: 'gjm_use_saved_fit_clicked / gjm_gate_saved_fit_eligible',
      breakdowns: ['mtm_category', 'product_handle'],
    },
    {
      key: 'refit_recommendation_frequency',
      title: 'Refit Recommendation Frequency',
      insightType: 'Trends',
      question: 'How often are customers classified as refit recommended?',
      events: ['gjm_gate_refit_recommended'],
      breakdowns: ['mtm_category', 'product_handle', 'profile_age_days'],
    },
    {
      key: 'modal_action_split',
      title: 'Modal Action Split',
      insightType: 'Funnel',
      question: 'After modal exposure, do users continue with saved fit or start a new fitting?',
      events: [
        'gjm_saved_fit_modal_shown',
        'gjm_refit_recommended_modal_shown',
        'gjm_use_saved_fit_clicked',
        'gjm_start_new_fitting_clicked',
      ],
      breakdowns: ['mtm_category', 'product_handle'],
    },
    {
      key: 'full_mtm_start_ratio',
      title: 'Full-MTM Start Ratio',
      insightType: 'Funnel',
      question: 'When full MTM is required, how often do users start a new fitting?',
      events: ['gjm_gate_full_mtm_required', 'gjm_start_new_fitting_clicked'],
      formula: 'gjm_start_new_fitting_clicked / gjm_gate_full_mtm_required',
      breakdowns: ['mtm_category', 'product_handle'],
    },
  ],
};

const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY || process.env.POSTHOG_API_KEY || '';
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.posthog.com';

if (!POSTHOG_API_KEY) {
  console.error('ERROR: POSTHOG_PERSONAL_API_KEY (or POSTHOG_API_KEY) is not set');
  process.exit(1);
}

/**
 * Convert dashboard pack blocks to PostHog insight configurations
 */
function blockToInsight(block) {
  const insightTypeMap = {
    Trends: 'TRENDS',
    Funnel: 'FUNNELS',
    Retention: 'RETENTION',
  };

  const config = {
    name: block.title,
    description: block.question,
    insight_type: insightTypeMap[block.insightType] || 'TRENDS',
    display: 'LineChart',
  };

  // Add events
  if (block.events && block.events.length > 0) {
    config.events = block.events.map((eventName) => ({
      id: eventName,
    }));
  }

  // Add breakdowns
  if (block.breakdowns && block.breakdowns.length > 0) {
    config.breakdown = block.breakdowns[0];
    config.breakdown_type = 'event';
  }

  // Add filters
  if (block.filters && block.filters.length > 0) {
    config.filters = {
      events: block.filters.map((f) => ({
        key: f.property,
        value: f.value,
        operator: f.operator,
      })),
    };
  }

  // Add formula if present
  if (block.formula) {
    config.formula = block.formula;
  }

  return config;
}

/**
 * Create an insight in PostHog
 */
async function createInsight(insight, dashboardId) {
  try {
    const response = await fetch(`${POSTHOG_HOST}/api/projects/@current/insights/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${POSTHOG_API_KEY}`,
      },
      body: JSON.stringify({
        ...insight,
        dashboard: dashboardId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create insight: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error(`Failed to create insight "${insight.name}":`, error);
    return null;
  }
}

/**
 * Create a dashboard in PostHog
 */
async function createDashboard(name, description) {
  try {
    const response = await fetch(`${POSTHOG_HOST}/api/projects/@current/dashboards/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${POSTHOG_API_KEY}`,
      },
      body: JSON.stringify({
        name,
        description,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create dashboard: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error(`Failed to create dashboard "${name}":`, error);
    return null;
  }
}

/**
 * Main seeding function
 */
async function seedDashboards() {
  console.log('🚀 Starting PostHog dashboard seeding...\n');

  // Create Non-Tailor Configurator Dashboard
  console.log('📊 Creating Non-Tailor Configurator dashboard...');
  const configDashboardId = await createDashboard(
    NON_TAILOR_CONFIGURATOR_DASHBOARD_PACK.name,
    NON_TAILOR_CONFIGURATOR_DASHBOARD_PACK.description,
  );

  if (!configDashboardId) {
    console.error('❌ Failed to create Non-Tailor Configurator dashboard');
    return;
  }

  console.log(`✅ Dashboard created (ID: ${configDashboardId})`);
  console.log('\n📈 Adding insights to Non-Tailor Configurator dashboard...\n');

  // Add insights to Non-Tailor Configurator Dashboard
  let configInsightCount = 0;
  for (const block of NON_TAILOR_CONFIGURATOR_DASHBOARD_PACK.blocks) {
    const insight = blockToInsight(block);
    const insightId = await createInsight(insight, configDashboardId);
    if (insightId) {
      console.log(`  ✅ ${insight.name}`);
      configInsightCount++;
    } else {
      console.log(`  ❌ ${insight.name}`);
    }
  }

  console.log(`\n✅ Added ${configInsightCount} insights to Non-Tailor Configurator dashboard\n`);

  // Create MTM Gate Dashboard
  console.log('📊 Creating MTM Gate Performance dashboard...');
  const mtmDashboardId = await createDashboard(
    MTM_GATE_DASHBOARD_PACK.name,
    MTM_GATE_DASHBOARD_PACK.description,
  );

  if (!mtmDashboardId) {
    console.error('❌ Failed to create MTM Gate dashboard');
    return;
  }

  console.log(`✅ Dashboard created (ID: ${mtmDashboardId})`);
  console.log('\n📈 Adding insights to MTM Gate Performance dashboard...\n');

  // Add insights to MTM Gate Dashboard
  let mtmInsightCount = 0;
  for (const block of MTM_GATE_DASHBOARD_PACK.blocks) {
    const insight = blockToInsight(block);
    const insightId = await createInsight(insight, mtmDashboardId);
    if (insightId) {
      console.log(`  ✅ ${insight.name}`);
      mtmInsightCount++;
    } else {
      console.log(`  ❌ ${insight.name}`);
    }
  }

  console.log(`\n✅ Added ${mtmInsightCount} insights to MTM Gate Performance dashboard\n`);

  console.log('🎉 Dashboard seeding complete!');
  console.log(`\nView your dashboards at:`);
  console.log(`  - Non-Tailor Configurator: ${POSTHOG_HOST}/dashboard/${configDashboardId}`);
  console.log(`  - MTM Gate Performance: ${POSTHOG_HOST}/dashboard/${mtmDashboardId}`);
}

seedDashboards().catch(console.error);
