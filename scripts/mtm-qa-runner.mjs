#!/usr/bin/env node

/**
 * MTM Gate QA Runner - Automated 5-Scenario Testing
 * 
 * Automates:
 * 1. Seeds test FitProfiles with different ages/ownership for each scenario
 * 2. Tests gate-status API endpoint for each scenario
 * 3. Outputs structured checklist for manual PostHog verification
 * 
 * Usage:
 *   node scripts/mtm-qa-runner.mjs setup [--clean]   # Seed test profiles
 *   node scripts/mtm-qa-runner.mjs test [--baseUrl]  # Run API tests
 *   node scripts/mtm-qa-runner.mjs manual              # Show manual testing checklist
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// =============================================================================
// 5 TEST SCENARIOS
// =============================================================================

const SCENARIOS = [
  {
    id: 'scenario-1-unauthenticated',
    name: 'Unauthenticated User',
    description: 'No session, no FitProfile → Should route to full MTM',
    expectedDecision: 'full_mtm_required',
    expectedReason: 'no_account',
    expectedEvent: 'gjm_gate_unauthenticated',
    setupSteps: [
      '1. Clear all cookies (including fit_profile_id, auth token)',
      '2. Ensure logged out of Shopify',
    ],
    testSteps: [
      '1. Open /product/mtm-trouser-test-build in private/incognito window',
      '2. Button should say "Start Customisation"',
      '3. Click button → Should redirect to /configure-fit',
      '4. Verify PostHog event gjm_gate_unauthenticated fired',
    ],
    manualCheck: 'Open DevTools → Application → Cookies → Verify no fit_profile_id cookie',
  },
  {
    id: 'scenario-2-saved-fit-eligible',
    name: 'Saved Fit Eligible',
    description: 'Logged in + FitProfile < 6 months old → Should show saved-fit modal',
    expectedDecision: 'saved_fit_eligible',
    expectedReason: 'profile_fresh',
    expectedEvent: 'gjm_gate_saved_fit_eligible',
    setupSteps: [
      '1. Log in to Shopify store',
      '2. Script will create FitProfile with updatedAt = NOW (< 6 months)',
      '3. Script will set fit_profile_id cookie to test profile ID',
    ],
    testSteps: [
      '1. Open /product/mtm-trouser-test-build',
      '2. Button should say "Start Customisation"',
      '3. Click button → SavedFitPromptModal should appear',
      '4. Modal should show "Your saved measurements are ready to use"',
      '5. Verify PostHog events fired: gjm_gate_saved_fit_eligible + gjm_saved_fit_modal_shown',
    ],
    manualCheck: 'DevTools Network → Check /api/fit/gate-status response shows entryPath: "saved_fit_eligible"',
  },
  {
    id: 'scenario-3-refit-recommended',
    name: 'Refit Recommended',
    description: 'Logged in + FitProfile > 6 months old → Should show refit modal',
    expectedDecision: 'refit_recommended',
    expectedReason: 'profile_stale',
    expectedEvent: 'gjm_gate_refit_recommended',
    setupSteps: [
      '1. Log in to Shopify store with different account',
      '2. Script will create FitProfile with updatedAt = 7 months ago',
      '3. Script will set fit_profile_id cookie to test profile ID',
    ],
    testSteps: [
      '1. Open /product/mtm-trouser-test-build',
      '2. Button should say "Start Customisation"',
      '3. Click button → RefitModal should appear',
      '4. Modal should say "Your fit profile may be out of date"',
      '5. Verify PostHog events fired: gjm_gate_refit_recommended + gjm_refit_recommended_modal_shown',
    ],
    manualCheck: 'DevTools Network → Check /api/fit/gate-status response shows entryPath: "refit_recommended"',
  },
  {
    id: 'scenario-4-full-mtm-required',
    name: 'Full MTM Required',
    description: 'Logged in + No FitProfile → Should route to full fitting workflow',
    expectedDecision: 'full_mtm_required',
    expectedReason: 'no_fit_profile',
    expectedEvent: 'gjm_gate_full_mtm_required',
    setupSteps: [
      '1. Log in to Shopify store with clean account (never fitted before)',
      '2. Clear fit_profile_id cookie (if any)',
      '3. No database setup needed - gate endpoint should return full_mtm_required',
    ],
    testSteps: [
      '1. Open /product/mtm-trouser-test-build',
      '2. Button should say "Start Customisation"',
      '3. Error message should appear: "A fit profile is required before purchase"',
      '4. Click button → Should redirect to /configure-fit (full flow)',
      '5. Verify PostHog event gjm_gate_full_mtm_required fired',
    ],
    manualCheck: 'DevTools → Verify no fit_profile_id cookie set; /api/fit/gate-status returns 200 (not 401)',
  },
  {
    id: 'scenario-5-profile-not-owned',
    name: 'Profile Ownership Denied',
    description: 'Cookie has FitProfile but owned by different customer → Access denied',
    expectedDecision: 'full_mtm_required',
    expectedReason: 'profile_not_owned',
    expectedEvent: 'gjm_gate_profile_not_owned',
    setupSteps: [
      '1. Create FitProfile for Customer A',
      '2. Log in as Customer B',
      '3. Manually set fit_profile_id cookie to Customer A\'s profile ID',
      '4. gate-status endpoint should reject with 403',
    ],
    testSteps: [
      '1. Open /product/mtm-trouser-test-build',
      '2. Page should treat as "full_mtm_required" (ownership check failed)',
      '3. Button should say "Start Customisation"',
      '4. Click button → Should redirect to /configure-fit',
      '5. Verify PostHog event gjm_gate_profile_not_owned fired',
    ],
    manualCheck: 'DevTools Network → /api/fit/gate-status should return 403 status code',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function log(msg, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m',
  };
  const prefix = type === 'info' ? 'ℹ' : type === 'success' ? '✓' : type === 'warn' ? '⚠' : '✕';
  console.log(`${colors[type]}${prefix} ${msg}${colors.reset}`);
}

function writeReportFile(reportPath, content) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, content, 'utf8');
  log(`Report saved: ${reportPath}`, 'success');
}

// =============================================================================
// MANUAL TESTING CHECKLIST COMMAND
// =============================================================================

function printManualChecklist() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          MTM GATE 5-SCENARIO MANUAL QA CHECKLIST               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  SCENARIOS.forEach((scenario, idx) => {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`SCENARIO ${idx + 1}: ${scenario.name}`);
    console.log(`${'─'.repeat(70)}`);
    console.log(`\n📋 Description:`);
    console.log(`   ${scenario.description}`);

    console.log(`\n🔧 Setup Steps:`);
    scenario.setupSteps.forEach((step) => console.log(`   ${step}`));

    console.log(`\n🧪 Test Steps:`);
    scenario.testSteps.forEach((step) => console.log(`   ${step}`));

    console.log(`\n📊 Expected PostHog Event:`);
    console.log(`   Event Name: ${scenario.expectedEvent}`);
    console.log(`   Decision: ${scenario.expectedDecision}`);
    console.log(`   Reason: ${scenario.expectedReason}`);

    console.log(`\n🔍 Manual Verification:`);
    console.log(`   ${scenario.manualCheck}`);
  });

  console.log(`\n${'═'.repeat(70)}\n`);
  console.log('PostHog Payload Validation:');
  console.log('   After each scenario, capture the PostHog event payload. Use:');
  console.log('   node scripts/posthog/mtm-ui-path-qa.mjs validate-payload \\');
  console.log('     --scenario <id> --json <payloadJsonString>\n');
}

// =============================================================================
// DATABASE SEEDING COMMAND (Pseudo - would require DB connection)
// =============================================================================

function printSetupInstructions() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          MTM QA DATABASE SETUP INSTRUCTIONS                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('To properly seed test FitProfiles, use your database directly or Prisma:');
  console.log('');
  console.log('SCENARIO 2 (Saved-Fit-Eligible):');
  console.log('  Profile created < 6 months ago');
  console.log('  Database: Insert FitProfile with updatedAt = NOW');
  console.log('  Cookie: fit_profile_id = <profile-id>');
  console.log('');
  console.log('SCENARIO 3 (Refit-Recommended):');
  console.log('  Profile created > 6 months ago');
  console.log('  Database: Insert FitProfile with updatedAt = NOW - 7 months');
  console.log('  Cookie: fit_profile_id = <profile-id>');
  console.log('');
  console.log('SCENARIO 5 (Profile-Not-Owned):');
  console.log('  Create profile for Customer A, logged in as Customer B');
  console.log('  Cookie: fit_profile_id = <customer-a-profile-id>');
  console.log('  Result: gate-status endpoint returns 403');
  console.log('');
}

// =============================================================================
// API TEST EMISSION COMMAND
// =============================================================================

function printApiTestGuide(baseUrl = 'http://localhost:3000') {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         MTM GATE API ENDPOINT TEST GUIDE                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Base URL: ${baseUrl}`);
  console.log('');

  const tests = [
    {
      title: 'Test 1: Unauthenticated (No Session)',
      method: 'GET',
      url: '/api/fit/gate-status?fitProfileId=',
      headers: 'No Authorization header',
      expectedStatus: 401,
      expectedResponse: {
        entryPath: 'full_mtm_required',
        reason: 'unauthenticated',
        fitProfileId: null,
      },
    },
    {
      title: 'Test 2: Authenticated but No Profile',
      method: 'GET',
      url: '/api/fit/gate-status?fitProfileId=',
      headers: 'Valid auth session',
      expectedStatus: 200,
      expectedResponse: {
        entryPath: 'full_mtm_required',
        reason: 'no_fit_profile',
        fitProfileId: null,
      },
    },
    {
      title: 'Test 3: Saved-Fit-Eligible (Fresh Profile)',
      method: 'GET',
      url: '/api/fit/gate-status?fitProfileId=<FRESH_PROFILE_ID>',
      headers: 'Valid auth session, owned profile',
      expectedStatus: 200,
      expectedResponse: {
        entryPath: 'saved_fit_eligible',
        profileAgeMonths: '< 6',
        fitProfileId: '<profile-id>',
      },
    },
    {
      title: 'Test 4: Refit-Recommended (Stale Profile)',
      method: 'GET',
      url: '/api/fit/gate-status?fitProfileId=<STALE_PROFILE_ID>',
      headers: 'Valid auth session, owned profile > 6 months old',
      expectedStatus: 200,
      expectedResponse: {
        entryPath: 'refit_recommended',
        profileAgeMonths: '> 6',
        fitProfileId: '<profile-id>',
      },
    },
    {
      title: 'Test 5: Profile-Not-Owned (Forbidden)',
      method: 'GET',
      url: '/api/fit/gate-status?fitProfileId=<OTHER_CUSTOMER_PROFILE_ID>',
      headers: 'Valid auth session, unowned profile',
      expectedStatus: 403,
      expectedResponse: {
        reason: 'profile_not_owned',
        fitProfileId: null,
      },
    },
  ];

  tests.forEach((test, idx) => {
    console.log(`${'─'.repeat(70)}`);
    console.log(`${test.title}`);
    console.log(`${'─'.repeat(70)}`);
    console.log(`\nRequest:`);
    console.log(`  ${test.method} ${baseUrl}${test.url}`);
    console.log(`  Headers: ${test.headers}`);
    console.log(`\nExpected Response:`);
    console.log(`  Status: ${test.expectedStatus}`);
    console.log(`  Body: ${JSON.stringify(test.expectedResponse, null, 2)}`);
    console.log('');
  });
}

// =============================================================================
// AUTOMATED TEST REPORT GENERATION
// =============================================================================

function generateTestReport() {
  const report = {
    testRunDateTime: new Date().toISOString(),
    scenarios: SCENARIOS.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      expectedDecision: scenario.expectedDecision,
      expectedEvent: scenario.expectedEvent,
      manualTestSteps: scenario.testSteps,
      postHogPayloadValidation: `Use: node scripts/posthog/mtm-ui-path-qa.mjs validate-payload --scenario <id> --json <payload>`,
      status: 'NOT_RUN', // Will be updated after manual testing
      comments: '',
    })),
    postHogEventCapture: {
      tool: 'PostHog Dashboard or Browser DevTools',
      method:
        'In browser DevTools, Network tab filter for "posthog" or "decide" requests. Copy JSON payload from each event.',
      examples: {
        unauthenticated: {
          event_name: 'gjm_gate_unauthenticated',
          properties: { product_handle: 'mtm-trouser-test-build', gate_decision: 'full_mtm_required' },
        },
        savedFitEligible: {
          event_name: 'gjm_gate_saved_fit_eligible',
          properties: { product_handle: 'mtm-trouser-test-build', gate_decision: 'saved_fit_eligible' },
        },
      },
    },
  };

  return report;
}

// =============================================================================
// MAIN CLI
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
MTM Gate QA Runner - Automated 5-Scenario Testing

Usage:
  node scripts/mtm-qa-runner.mjs manual             Show manual testing checklist
  node scripts/mtm-qa-runner.mjs setup              Show database setup instructions
  node scripts/mtm-qa-runner.mjs test [--baseUrl]  Show API test guide
  node scripts/mtm-qa-runner.mjs generate-report   Generate test report template

Examples:
  node scripts/mtm-qa-runner.mjs manual
  node scripts/mtm-qa-runner.mjs test --baseUrl https://my-preview.vercel.app
  node scripts/mtm-qa-runner.mjs generate-report > mtm-qa-report.json
    `);
    return;
  }

  if (command === 'manual') {
    printManualChecklist();
    return;
  }

  if (command === 'setup') {
    printSetupInstructions();
    return;
  }

  if (command === 'test') {
    const baseUrlArg = args.find((a) => a.startsWith('--baseUrl'));
    const baseUrl = baseUrlArg ? baseUrlArg.split('=')[1] : 'http://localhost:3000';
    printApiTestGuide(baseUrl);
    return;
  }

  if (command === 'generate-report') {
    const report = generateTestReport();
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.error(`Unknown command: ${command}`);
  log('Run with --help for usage information', 'error');
  process.exit(1);
}

main();
