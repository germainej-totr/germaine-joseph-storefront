import fs from 'node:fs';
import path from 'node:path';

const outputPath = path.resolve(process.cwd(), 'scripts/posthog/mtm-dashboard-pack.json');

const dashboardPack = {
  id: 'gjm-mtm-gate-v1',
  name: 'GJM MTM Gate Performance',
  createdAt: new Date().toISOString(),
  notes: [
    'Payload contract is stable and aligned with /api/analytics/mtm-gate.',
    'Create each block in PostHog using the listed event set and breakdowns.',
    'Use same event names as emitted by trackMtmGateEvent.ts.',
  ],
  blocks: [
    {
      title: 'Gate Decision Mix',
      insightType: 'Trends',
      events: [
        'gjm_gate_full_mtm_required',
        'gjm_gate_saved_fit_eligible',
        'gjm_gate_refit_recommended',
        'gjm_gate_unauthenticated',
        'gjm_gate_profile_not_owned',
      ],
      breakdownBy: ['mtm_category', 'product_handle'],
    },
    {
      title: 'Saved-Fit Acceptance Rate',
      insightType: 'Funnel',
      events: ['gjm_gate_saved_fit_eligible', 'gjm_use_saved_fit_clicked'],
      formula: 'gjm_use_saved_fit_clicked / gjm_gate_saved_fit_eligible',
      breakdownBy: ['mtm_category', 'product_handle'],
    },
    {
      title: 'Refit Recommendation Frequency',
      insightType: 'Trends',
      events: ['gjm_gate_refit_recommended'],
      breakdownBy: ['mtm_category', 'product_handle', 'profile_age_days'],
    },
    {
      title: 'Modal Action Split',
      insightType: 'Funnel',
      events: [
        'gjm_saved_fit_modal_shown',
        'gjm_refit_recommended_modal_shown',
        'gjm_use_saved_fit_clicked',
        'gjm_start_new_fitting_clicked',
      ],
      breakdownBy: ['mtm_category', 'product_handle'],
    },
    {
      title: 'Full-MTM Start Ratio',
      insightType: 'Funnel',
      events: ['gjm_gate_full_mtm_required', 'gjm_start_new_fitting_clicked'],
      formula: 'gjm_start_new_fitting_clicked / gjm_gate_full_mtm_required',
      breakdownBy: ['mtm_category', 'product_handle'],
    },
  ],
};

fs.writeFileSync(outputPath, JSON.stringify(dashboardPack, null, 2), 'utf8');
console.log(`MTM PostHog dashboard pack written: ${outputPath}`);
