#!/usr/bin/env node

/**
 * QA Seed Script — Creates FitProfiles for MTM Gate Scenarios 2, 3, 5
 *
 * Usage:
 *   node scripts/seed-qa-fit-profiles.mjs seed               # Create all test profiles
 *   node scripts/seed-qa-fit-profiles.mjs show               # Show created profile IDs + cookie values
 *   node scripts/seed-qa-fit-profiles.mjs clean              # Remove all QA test profiles from DB
 *
 * Prerequisites:
 *   - DATABASE_URL set in .env.local or environment
 *   - npx prisma generate has been run
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load env vars from .env.local first, then .env
config({ path: path.resolve(__dirname, '../.env.local') });
config({ path: path.resolve(__dirname, '../.env') });

// Dynamically import Prisma client after env is loaded
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

// =============================================================================
// QA TEST PROFILES CONFIG
// =============================================================================

const sevenMonthsAgo = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 7);
  return d;
};

const QA_PROFILES = [
  {
    key: 'scenario-2-fresh',
    email: 'qa-test-fresh-profile@gjm-testing.local',
    profile_name: 'QA Scenario 2 — Saved Fit Eligible',
    updatedAtOverride: null,            // null = NOW (Prisma default) — fresh profile
    scenario: 'Scenario 2: Saved Fit Eligible',
    description: 'Profile < 6 months old → should show SavedFitPromptModal',
  },
  {
    key: 'scenario-3-stale',
    email: 'qa-test-stale-profile@gjm-testing.local',
    profile_name: 'QA Scenario 3 — Refit Recommended',
    updatedAtOverride: sevenMonthsAgo(), // 7 months old → stale
    scenario: 'Scenario 3: Refit Recommended',
    description: 'Profile > 6 months old → should show refit modal',
  },
  {
    key: 'scenario-5-other-customer',
    email: 'qa-test-other-customer@gjm-testing.local',
    profile_name: 'QA Scenario 5 — Profile Not Owned',
    updatedAtOverride: null,
    // No customerId — ownership is rejected by email mismatch (email ≠ logged-in user)
    scenario: 'Scenario 5: Profile Not Owned',
    description: 'Profile email does not match session → gate-status returns 403',
  },
];

// =============================================================================
// COMMANDS
// =============================================================================

async function seedProfiles() {
  console.log('\n🌱 Seeding QA FitProfiles...\n');
  const results = [];

  for (const profile of QA_PROFILES) {
    try {
      const data = {
        email: profile.email,
        profile_name: profile.profile_name,
        isActive: true,
        ...(profile.customerId ? { customerId: profile.customerId } : {}),
      };

      const created = await prisma.fitProfile.upsert({
        where: { email: profile.email },
        update: {
          profile_name: profile.profile_name,
          isActive: true,
          ...(profile.customerId ? { customerId: profile.customerId } : {}),
        },
        create: data,
      });

      // If stale, update the updatedAt using raw SQL (Prisma auto-sets updatedAt on create)
      if (profile.updatedAtOverride) {
        await prisma.$executeRaw`
          UPDATE "FitProfile" 
          SET "updatedAt" = ${profile.updatedAtOverride}
          WHERE id = ${created.id}
        `;
      }

      const final = await prisma.fitProfile.findUnique({ where: { id: created.id } });

      results.push({ ...profile, id: final.id, updatedAt: final.updatedAt });

      console.log(`  ✓ ${profile.scenario}`);
      console.log(`    ID: ${final.id}`);
      console.log(`    Email: ${profile.email}`);
      console.log(`    updatedAt: ${final.updatedAt.toISOString()}`);
      console.log('');
    } catch (err) {
      console.error(`  ✕ Failed to seed ${profile.key}:`);
      console.error(`    ${err.message}`);
    }
  }

  return results;
}

async function showProfiles() {
  console.log('\n📋 QA FitProfile Cookie Values\n');
  console.log('Use these values to manually set the fit_profile_id cookie in DevTools.\n');
  console.log('DevTools → Application → Cookies → [your-site] → fit_profile_id\n');

  for (const profile of QA_PROFILES) {
    const record = await prisma.fitProfile.findUnique({ where: { email: profile.email } });

    if (!record) {
      console.warn(`  ⚠ ${profile.scenario} — Profile NOT FOUND in DB. Run 'seed' first.\n`);
      continue;
    }

    const ageMs = Date.now() - record.updatedAt.getTime();
    const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.4));

    console.log(`  ─────────────────────────────────────────────────────`);
    console.log(`  ${profile.scenario}`);
    console.log(`  ${profile.description}`);
    console.log(`  ─────────────────────────────────────────────────────`);
    console.log(`  Cookie Name:  fit_profile_id`);
    console.log(`  Cookie Value: ${record.id}`);
    console.log(`  Profile Age:  ${ageMonths} month(s)`);
    console.log(`  updatedAt:    ${record.updatedAt.toISOString()}`);
    if (profile.customerId) {
      console.log(`  customerId:   ${record.customerId} (intentionally mismatched)`);
    }
    console.log('');
  }

  console.log('  ─────────────────────────────────────────────────────');
  console.log('  NOTE for Scenario 2 & 3: You must also be LOGGED IN to your');
  console.log('  Shopify store account where the profile EMAIL matches your session.');
  console.log('  For Scenario 5: Log in as ANY real account — the profile email');
  console.log('  (qa-test-other-customer@gjm-testing.local) will not match your session,');
  console.log('  so the ownership check will fail → gate-status returns 403.\n');
}

async function cleanProfiles() {
  console.log('\n🗑  Removing QA FitProfiles...\n');

  for (const profile of QA_PROFILES) {
    try {
      await prisma.fitProfile.deleteMany({ where: { email: profile.email } });
      console.log(`  ✓ Deleted profile for: ${profile.email}`);
    } catch (err) {
      console.warn(`  ⚠ Could not delete ${profile.email}: ${err.message}`);
    }
  }

  console.log('\n  Done.\n');
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const command = process.argv[2];

  try {
    if (!command || command === 'seed') {
      await seedProfiles();
      console.log('─────────────────────────────────────────────────────────────');
      console.log('Run: node scripts/seed-qa-fit-profiles.mjs show');
      console.log('     → to get the cookie values for each scenario.\n');
    } else if (command === 'show') {
      await showProfiles();
    } else if (command === 'clean') {
      await cleanProfiles();
    } else {
      console.error(`Unknown command: "${command}". Use: seed | show | clean`);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
