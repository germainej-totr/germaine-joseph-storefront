#!/usr/bin/env node
/**
 * A16 Fabric Catalogue CSV Importer
 * Usage: node scripts/import-fabrics-csv.mjs path/to/fabrics.csv [--dry-run]
 *
 * Expected CSV columns (see FabricCsvRow in types/fabric.ts):
 *   name, description, mill, season, composition, colour_family, pattern,
 *   weight_gm, article_code, upcharge_pence, swatch_image_url, drape_image_url,
 *   suitable_for, care_instructions, is_limited_edition
 */

import { createReadStream } from 'fs';
import { resolve } from 'path';
import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const csvPath = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');

if (!csvPath) {
  console.error('Usage: node scripts/import-fabrics-csv.mjs <path/to/fabrics.csv> [--dry-run]');
  process.exit(1);
}

const VALID_SEASONS = ['all_season', 'spring_summer', 'autumn_winter'];
const VALID_COLOURS = ['navy', 'grey', 'charcoal', 'brown', 'beige', 'black', 'blue', 'green', 'other'];
const VALID_PATTERNS = ['plain', 'stripe', 'check', 'windowpane', 'herringbone', 'houndstooth', 'texture', 'other'];
const VALID_CATEGORIES = ['suit', 'shirt', 'trouser', 'overcoat', 'blazer', 'vest', 'jacket'];

function validateRow(row, rowIndex) {
  const errors = [];

  if (!row.name?.trim()) errors.push('name is required');
  if (!row.mill?.trim()) errors.push('mill is required');
  if (!row.season?.trim()) errors.push('season is required');
  else if (!VALID_SEASONS.includes(row.season.trim())) errors.push(`season "${row.season}" is invalid (must be: ${VALID_SEASONS.join(', ')})`);
  if (!row.composition?.trim()) errors.push('composition is required');
  if (!row.colour_family?.trim()) errors.push('colour_family is required');
  else if (!VALID_COLOURS.includes(row.colour_family.trim())) errors.push(`colour_family "${row.colour_family}" is invalid`);
  if (!row.pattern?.trim()) errors.push('pattern is required');
  else if (!VALID_PATTERNS.includes(row.pattern.trim())) errors.push(`pattern "${row.pattern}" is invalid`);
  if (!row.article_code?.trim()) errors.push('article_code is required for upsert key');
  if (!row.suitable_for?.trim()) errors.push('suitable_for is required');
  else {
    const cats = row.suitable_for.split(',').map((s) => s.trim());
    for (const cat of cats) {
      if (!VALID_CATEGORIES.includes(cat)) errors.push(`suitable_for contains invalid category "${cat}"`);
    }
  }

  if (errors.length > 0) {
    console.error(`Row ${rowIndex}: ${errors.join('; ')}`);
    return false;
  }
  return true;
}

async function importRow(row) {
  const suitableFor = row.suitable_for.split(',').map((s) => s.trim()).join(',');

  const data = {
    name: row.name.trim(),
    description: row.description?.trim() || null,
    mill: row.mill.trim(),
    season: row.season.trim(),
    composition: row.composition.trim(),
    colourFamily: row.colour_family.trim(),
    pattern: row.pattern.trim(),
    weightGm: row.weight_gm ? parseInt(row.weight_gm, 10) : null,
    articleCode: row.article_code.trim(),
    upchargePence: row.upcharge_pence ? parseInt(row.upcharge_pence, 10) : 0,
    swatchImageUrl: row.swatch_image_url?.trim() || null,
    drapeImageUrl: row.drape_image_url?.trim() || null,
    suitableFor,
    careInstructions: row.care_instructions?.trim() || null,
    isLimitedEdition: row.is_limited_edition?.trim().toLowerCase() === 'true',
  };

  await prisma.fabric.upsert({
    where: { articleCode: data.articleCode },
    update: data,
    create: data,
  });
}

async function main() {
  const rows = [];

  await new Promise((resolve, reject) => {
    createReadStream(resolve(process.cwd(), csvPath))
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`\nParsed ${rows.length} rows from ${csvPath}`);

  let valid = 0;
  let invalid = 0;

  for (let i = 0; i < rows.length; i++) {
    if (validateRow(rows[i], i + 2)) {
      valid++;
    } else {
      invalid++;
    }
  }

  console.log(`Validation: ${valid} valid, ${invalid} invalid`);

  if (invalid > 0) {
    console.error('\nAborting: fix validation errors before import.');
    process.exit(1);
  }

  if (dryRun) {
    console.log('\nDry run complete — no records written.');
    process.exit(0);
  }

  console.log('\nImporting…');
  let upserted = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      await importRow(row);
      upserted++;
      process.stdout.write(`\r  ${upserted} / ${rows.length}`);
    } catch (err) {
      console.error(`\nFailed to upsert "${row.article_code}":`, err.message);
      failed++;
    }
  }

  console.log(`\n\nDone: ${upserted} upserted, ${failed} failed.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
