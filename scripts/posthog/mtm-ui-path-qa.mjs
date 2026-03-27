import fs from 'node:fs';
import path from 'node:path';

const requiredPayloadKeys = [
  'event_name',
  'occurred_at',
  'product_handle',
  'product_type',
  'mtm_category',
  'variant_id',
  'customer_id',
  'fit_profile_id',
  'gate_decision',
  'gate_reason',
  'profile_age_days',
];

const scenarios = [
  {
    id: 'unauthenticated',
    expectedDecisionEvent: 'gjm_gate_unauthenticated',
    expectedModalEvent: null,
    expectedActionEvents: ['gjm_start_new_fitting_clicked'],
    expectedUiOutcome: 'Guest user is blocked from saved-fit bypass and routed into fit/auth path.',
  },
  {
    id: 'saved-fit-eligible',
    expectedDecisionEvent: 'gjm_gate_saved_fit_eligible',
    expectedModalEvent: 'gjm_saved_fit_modal_shown',
    expectedActionEvents: ['gjm_use_saved_fit_clicked', 'gjm_start_new_fitting_clicked'],
    expectedUiOutcome: 'Saved-fit modal is shown; user can choose saved fit or start new fitting.',
  },
  {
    id: 'refit-recommended',
    expectedDecisionEvent: 'gjm_gate_refit_recommended',
    expectedModalEvent: 'gjm_refit_recommended_modal_shown',
    expectedActionEvents: ['gjm_start_new_fitting_clicked'],
    expectedUiOutcome: 'Refit recommendation is shown and routes user into fitting flow.',
  },
  {
    id: 'full-mtm-required',
    expectedDecisionEvent: 'gjm_gate_full_mtm_required',
    expectedModalEvent: null,
    expectedActionEvents: ['gjm_start_new_fitting_clicked'],
    expectedUiOutcome: 'User is directed to complete full MTM flow before checkout.',
  },
  {
    id: 'profile-not-owned',
    expectedDecisionEvent: 'gjm_gate_profile_not_owned',
    expectedModalEvent: null,
    expectedActionEvents: ['gjm_start_new_fitting_clicked'],
    expectedUiOutcome: 'Saved-fit bypass is denied when profile ownership does not match session identity.',
  },
];

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

function printChecklist() {
  console.log('MTM Manual UI QA Checklist');
  console.log('==========================\n');

  for (const scenario of scenarios) {
    console.log(`Scenario: ${scenario.id}`);
    console.log(`- Expected decision event: ${scenario.expectedDecisionEvent}`);
    console.log(`- Expected modal event: ${scenario.expectedModalEvent || 'none'}`);
    console.log(`- Expected action events: ${scenario.expectedActionEvents.join(', ')}`);
    console.log(`- Expected UI outcome: ${scenario.expectedUiOutcome}`);
    console.log('- Assertions:');
    console.log('  1) Correct gate decision on PDP');
    console.log('  2) Correct modal behavior where expected');
    console.log('  3) Correct CTA branching');
    console.log('  4) Correct event appears in PostHog');
    console.log('  5) Payload has required properties');
    console.log('  6) No broken redirect into fit/cart path\n');
  }

  console.log('Required payload keys:');
  for (const key of requiredPayloadKeys) {
    console.log(`- ${key}`);
  }
}

function writeTemplate(outputPath) {
  const template = {
    generated_at: new Date().toISOString(),
    required_payload_keys: requiredPayloadKeys,
    scenarios: scenarios.map((scenario) => ({
      scenario: scenario.id,
      expected_decision_event: scenario.expectedDecisionEvent,
      expected_modal_event: scenario.expectedModalEvent,
      expected_action_events: scenario.expectedActionEvents,
      checks: {
        gate_decision_on_pdp: 'pending',
        modal_behavior: 'pending',
        cta_branching: 'pending',
        posthog_event: 'pending',
        payload_properties: 'pending',
        redirect_path_health: 'pending',
      },
      observed: {
        decision_event: null,
        modal_event: null,
        action_events: [],
        payload_sample: null,
        notes: '',
      },
      status: 'pending',
    })),
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
  console.log(`Wrote QA template: ${outputPath}`);
}

function validatePayload(payload, scenarioId) {
  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (!scenario) {
    console.error(`Unknown scenario: ${scenarioId}`);
    process.exit(1);
  }

  const missing = requiredPayloadKeys.filter((key) => !(key in payload));
  if (missing.length) {
    console.error(`Missing required payload keys: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (payload.event_name !== scenario.expectedDecisionEvent) {
    console.error(
      `Unexpected decision event. Expected ${scenario.expectedDecisionEvent}, got ${payload.event_name}`,
    );
    process.exit(1);
  }

  if (Number.isNaN(Number(payload.profile_age_days))) {
    console.error('profile_age_days must be numeric');
    process.exit(1);
  }

  console.log('Payload validation passed.');
  console.log(`Scenario: ${scenarioId}`);
  console.log(`Decision event: ${payload.event_name}`);
}

function printUsage() {
  console.log('Usage:');
  console.log('  node scripts/posthog/mtm-ui-path-qa.mjs checklist');
  console.log('  node scripts/posthog/mtm-ui-path-qa.mjs init-report [--out scripts/posthog/mtm-ui-qa-report.json]');
  console.log('  node scripts/posthog/mtm-ui-path-qa.mjs validate-payload --scenario <id> --json <payloadJsonString>');
  console.log('  node scripts/posthog/mtm-ui-path-qa.mjs validate-payload --scenario <id> --file <payload.json>');
}

function main() {
  const args = parseArgs(process.argv);
  const command = args._[0];

  if (command === 'checklist') {
    printChecklist();
    return;
  }

  if (command === 'init-report') {
    const out = args.out || 'scripts/posthog/mtm-ui-qa-report.json';
    const outputPath = path.resolve(process.cwd(), out);
    writeTemplate(outputPath);
    return;
  }

  if (command === 'validate-payload') {
    if (!args.scenario || (!args.json && !args.file)) {
      printUsage();
      process.exit(1);
    }

    let payload;
    try {
      if (args.file) {
        const filePath = path.resolve(process.cwd(), args.file);
        payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } else {
        payload = JSON.parse(args.json);
      }
    } catch {
      console.error('Invalid JSON payload supplied.');
      process.exit(1);
    }

    validatePayload(payload, args.scenario);
    return;
  }

  printUsage();
  process.exit(1);
}

main();
