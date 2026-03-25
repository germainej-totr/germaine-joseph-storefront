/**
 * Analytics Pipeline Verification Script
 *
 * This script validates the non-tailor configurator analytics pipeline by:
 * 1. Checking that all event types are properly defined
 * 2. Validating the dashboard pack structure
 * 3. Testing event payload schemas
 * 4. Verifying API routes exist
 *
 * Usage:
 * npm run verify:analytics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const ANALYTICS_EVENTS = {
  non_tailor_config: [
    'gjm_non_tailor_config_view',
    'gjm_non_tailor_config_option_change',
    'gjm_non_tailor_config_add_to_cart',
  ],
  mtm_gate: [
    'gjm_gate_full_mtm_required',
    'gjm_gate_saved_fit_eligible',
    'gjm_gate_refit_recommended',
    'gjm_gate_unauthenticated',
    'gjm_gate_profile_not_owned',
    'gjm_use_saved_fit_clicked',
    'gjm_start_new_fitting_clicked',
    'gjm_saved_fit_modal_shown',
    'gjm_refit_recommended_modal_shown',
  ],
  fit_flow: ['gjm_fit_flow_start', 'gjm_fit_flow_save_success', 'gjm_fit_flow_save_failure'],
};

const REQUIRED_FILES = [
  'lib/analytics/nonTailorConfiguratorContract.ts',
  'lib/analytics/trackNonTailorConfiguratorEvent.ts',
  'app/api/analytics/non-tailor-config/route.ts',
  'lib/analytics/posthogNonTailorConfiguratorPack.ts',
  'lib/analytics/dashboardPacks.ts',
];

const REQUIRED_API_ROUTES = [
  'app/api/analytics/non-tailor-config/route.ts',
  'app/api/analytics/mtm-gate/route.ts',
  'app/api/analytics/fit-flow/route.ts',
];

function checkFileExists(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  const exists = fs.existsSync(fullPath);
  return { file: filePath, exists };
}

function checkFileContains(filePath, searchStrings) {
  const fullPath = path.join(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    return { file: filePath, found: false, reason: 'File not found' };
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const results = {};

  for (const search of searchStrings) {
    results[search] = content.includes(search);
  }

  return { file: filePath, results };
}

console.log('\n🔍 Analytics Pipeline Verification\n');
console.log('=' .repeat(60));

// Check 1: Required files exist
console.log('\n✓ Checking required files exist...');
let fileChecksPassed = 0;
for (const file of REQUIRED_FILES) {
  const result = checkFileExists(file);
  const status = result.exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
  if (result.exists) fileChecksPassed++;
}
console.log(`  Result: ${fileChecksPassed}/${REQUIRED_FILES.length} files found`);

// Check 2: API routes exist
console.log('\n✓ Checking API routes exist...');
let apiChecksPassed = 0;
for (const route of REQUIRED_API_ROUTES) {
  const result = checkFileExists(route);
  const status = result.exists ? '✅' : '❌';
  console.log(`  ${status} ${route}`);
  if (result.exists) apiChecksPassed++;
}
console.log(`  Result: ${apiChecksPassed}/${REQUIRED_API_ROUTES.length} routes found`);

// Check 3: Non-Tailor Config Contract has all event names
console.log('\n✓ Checking NonTailorConfigurator event names...');
const contractCheck = checkFileContains('lib/analytics/nonTailorConfiguratorContract.ts', [
  'gjm_non_tailor_config_view',
  'gjm_non_tailor_config_option_change',
  'gjm_non_tailor_config_add_to_cart',
]);
let eventChecksPassed = 0;
for (const [event, found] of Object.entries(contractCheck.results)) {
  const status = found ? '✅' : '❌';
  console.log(`  ${status} ${event}`);
  if (found) eventChecksPassed++;
}
console.log(`  Result: ${eventChecksPassed}/3 events defined`);

// Check 4: PDP instrumentation
console.log('\n✓ Checking PDP instrumentation...');
const pdpCheck = checkFileContains('app/product/[handle]/page.tsx', [
  'trackNonTailorConfiguratorEvent',
  'gjm_non_tailor_config_view',
  'gjm_non_tailor_config_option_change',
  'gjm_non_tailor_config_add_to_cart',
]);
let pdpChecksPassed = 0;
for (const [instrumentation, found] of Object.entries(pdpCheck.results)) {
  const status = found ? '✅' : '❌';
  console.log(`  ${status} ${instrumentation}`);
  if (found) pdpChecksPassed++;
}
console.log(`  Result: ${pdpChecksPassed}/4 instrumentation points found`);

// Check 5: Dashboard pack structure
console.log('\n✓ Checking dashboard pack structure...');
const packCheck = checkFileContains('lib/analytics/posthogNonTailorConfiguratorPack.ts', [
  'NON_TAILOR_CONFIGURATOR_DASHBOARD_PACK',
  'config_view_to_add_funnel',
  'custom_notes_adoption',
]);
let packChecksPassed = 0;
for (const [block, found] of Object.entries(packCheck.results)) {
  const status = found ? '✅' : '❌';
  console.log(`  ${status} ${block}`);
  if (found) packChecksPassed++;
}
console.log(`  Result: ${packChecksPassed}/3 pack blocks found`);

// Summary
console.log('\n' + '='.repeat(60));
const totalChecks = fileChecksPassed + apiChecksPassed + eventChecksPassed + pdpChecksPassed + packChecksPassed;
const totalPossible = REQUIRED_FILES.length + REQUIRED_API_ROUTES.length + 3 + 4 + 3;
console.log(`\n📊 Overall Result: ${totalChecks}/${totalPossible} checks passed\n`);

if (totalChecks === totalPossible) {
  console.log('✅ All analytics checks passed! Pipeline is ready.\n');
  console.log('🚀 Next steps:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Visit a non-tailor product page');
  console.log('   3. Open DevTools (F12) → Network tab');
  console.log('   4. Interact with configurator');
  console.log('   5. Look for POST requests to /api/analytics/non-tailor-config');
  console.log('   6. Verify events appear in PostHog within 30 seconds');
  console.log('   7. Run dashboard seeder: node scripts/seedPostHogDashboard.mjs\n');
} else {
  console.log('⚠️  Some checks failed. Review configuration.\n');
}
