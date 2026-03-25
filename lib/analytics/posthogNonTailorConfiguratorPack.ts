import type { NonTailorConfiguratorEventName } from '@/lib/analytics/nonTailorConfiguratorContract';
import type { PostHogDashboardPack } from '@/lib/analytics/posthogMtmDashboardPack';

export const NON_TAILOR_CONFIGURATOR_DASHBOARD_PACK: PostHogDashboardPack<NonTailorConfiguratorEventName> = {
  id: 'gjm-non-tailor-config-v1',
  name: 'GJM Non-Tailor Configurator Funnel',
  description:
    'Conversion and engagement tracking for shoes, leather goods, and other non-tailor configurable categories.',
  blocks: [
    {
      key: 'config_view_to_add_funnel',
      title: 'Configurator Funnel: View → Change → Add to Cart',
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
