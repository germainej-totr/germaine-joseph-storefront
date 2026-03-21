import fs from 'node:fs';
import path from 'node:path';

const requiredBlocks = [
  'Gate Decision Mix',
  'Saved-Fit Acceptance Rate',
  'Refit Recommendation Frequency',
  'Modal Action Split',
  'Full-MTM Start Ratio',
];

const requiredEvents = [
  'gjm_gate_full_mtm_required',
  'gjm_gate_saved_fit_eligible',
  'gjm_gate_refit_recommended',
  'gjm_gate_unauthenticated',
  'gjm_gate_profile_not_owned',
  'gjm_use_saved_fit_clicked',
  'gjm_start_new_fitting_clicked',
  'gjm_saved_fit_modal_shown',
  'gjm_refit_recommended_modal_shown',
];

const filePath = path.resolve(process.cwd(), 'scripts/posthog/mtm-dashboard-pack.json');
if (!fs.existsSync(filePath)) {
  console.error(`Missing dashboard pack: ${filePath}`);
  process.exit(1);
}

const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const blocks = parsed.blocks || [];

if (blocks.length !== 5) {
  console.error(`Expected 5 blocks, found ${blocks.length}`);
  process.exit(1);
}

for (const blockTitle of requiredBlocks) {
  if (!blocks.some((b) => b.title === blockTitle)) {
    console.error(`Missing block: ${blockTitle}`);
    process.exit(1);
  }
}

const usedEvents = new Set();
for (const block of blocks) {
  for (const eventName of block.events || []) {
    usedEvents.add(eventName);
  }
}

for (const eventName of requiredEvents) {
  if (!usedEvents.has(eventName)) {
    console.error(`Required event missing from pack: ${eventName}`);
    process.exit(1);
  }
}

console.log('MTM dashboard pack integrity check passed.');
console.log(`Validated blocks: ${blocks.length}`);
console.log(`Validated events: ${usedEvents.size}`);
