/**
 * PostHog Dashboard Packs Index
 *
 * This module provides pre-configured dashboard packs for different funnel/analysis areas.
 * Each pack includes a set of insights (Trends, Funnels, Retention) tailored to a specific
 * business domain (e.g., MTM gate decisions, non-tailor configurator).
 *
 * Usage:
 * - Import packs as needed for testing or dashboard seeding
 * - Each pack has an `id`, `name`, `description`, and array of `blocks`
 * - Blocks can be used to programmatically build PostHog insights
 *
 * Example:
 * ```
 * import { MTM_GATE_DASHBOARD_PACK } from '@/lib/analytics/posthogMtmDashboardPack';
 * import { NON_TAILOR_CONFIGURATOR_DASHBOARD_PACK } from '@/lib/analytics/posthogNonTailorConfiguratorPack';
 *
 * const allPacks = [MTM_GATE_DASHBOARD_PACK, NON_TAILOR_CONFIGURATOR_DASHBOARD_PACK];
 * ```
 */

export { MTM_GATE_DASHBOARD_PACK } from '@/lib/analytics/posthogMtmDashboardPack';
export type { PostHogDashboardBlock, PostHogDashboardPack } from '@/lib/analytics/posthogMtmDashboardPack';

export { NON_TAILOR_CONFIGURATOR_DASHBOARD_PACK } from '@/lib/analytics/posthogNonTailorConfiguratorPack';
