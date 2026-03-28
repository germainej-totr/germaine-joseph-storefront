import { prisma } from '@/lib/prisma';
import type {
  Fabric,
  FabricFilters,
  FabricSeason,
  FabricColourFamily,
  FabricPattern,
} from '@/types/fabric';
import type { MtmCategory } from '@/types/mtm';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a DB row (snake_case fields, pipe-delimited suitableFor) to the Fabric type */
function rowToFabric(row: {
  id: string;
  name: string;
  description: string | null;
  mill: string;
  season: string;
  composition: string;
  colourFamily: string;
  pattern: string;
  weightGm: number | null;
  articleCode: string | null;
  upchargePence: number;
  swatchImageUrl: string | null;
  drapeImageUrl: string | null;
  suitableFor: string;
  careInstructions: string | null;
  isActive: boolean;
  isLimitedEdition: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Fabric {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    mill: row.mill,
    season: row.season as FabricSeason,
    composition: row.composition,
    colourFamily: row.colourFamily as FabricColourFamily,
    pattern: row.pattern as FabricPattern,
    weightGm: row.weightGm ?? undefined,
    articleCode: row.articleCode ?? undefined,
    upchargePence: row.upchargePence,
    swatchImageUrl: row.swatchImageUrl ?? undefined,
    drapeImageUrl: row.drapeImageUrl ?? undefined,
    suitableFor: row.suitableFor.split(',').map((s) => s.trim()) as MtmCategory[],
    careInstructions: row.careInstructions ?? undefined,
    isActive: row.isActive,
    isLimitedEdition: row.isLimitedEdition,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Build a Prisma `where` clause from FabricFilters */
function buildWhereClause(filters: FabricFilters) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { isActive: true };

  if (filters.mill) {
    where.mill = { equals: filters.mill, mode: 'insensitive' };
  }
  if (filters.season) {
    where.season = filters.season;
  }
  if (filters.colourFamily) {
    where.colourFamily = filters.colourFamily;
  }
  if (filters.pattern) {
    where.pattern = filters.pattern;
  }
  if (filters.minWeightGm !== undefined || filters.maxWeightGm !== undefined) {
    where.weightGm = {};
    if (filters.minWeightGm !== undefined) where.weightGm.gte = filters.minWeightGm;
    if (filters.maxWeightGm !== undefined) where.weightGm.lte = filters.maxWeightGm;
  }
  if (filters.category) {
    // suitableFor is stored as comma-separated string
    where.suitableFor = { contains: filters.category };
  }
  if (filters.searchQuery) {
    const q = filters.searchQuery.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { mill: { contains: q, mode: 'insensitive' } },
      { composition: { contains: q, mode: 'insensitive' } },
      { articleCode: { contains: q, mode: 'insensitive' } },
    ];
  }

  return where;
}

// ---------------------------------------------------------------------------
// Public service API
// ---------------------------------------------------------------------------

/**
 * Fetch all active fabrics, optionally filtered.
 */
export async function listFabrics(filters: FabricFilters = {}): Promise<Fabric[]> {
  const rows = await prisma.fabric.findMany({
    where: buildWhereClause(filters),
    orderBy: [{ mill: 'asc' }, { name: 'asc' }],
  });
  return rows.map(rowToFabric);
}

/**
 * Fetch a single fabric by ID.
 */
export async function getFabricById(id: string): Promise<Fabric | null> {
  const row = await prisma.fabric.findUnique({ where: { id } });
  return row ? rowToFabric(row) : null;
}

/**
 * Fetch a single fabric by article code (unique mill reference).
 */
export async function getFabricByArticleCode(articleCode: string): Promise<Fabric | null> {
  const row = await prisma.fabric.findUnique({ where: { articleCode } });
  return row ? rowToFabric(row) : null;
}

/**
 * Return distinct mill names (for populating the Mill filter dropdown).
 */
export async function listFabricMills(): Promise<string[]> {
  const rows = await prisma.fabric.findMany({
    where: { isActive: true },
    select: { mill: true },
    distinct: ['mill'],
    orderBy: { mill: 'asc' },
  });
  return rows.map((r) => r.mill);
}

/**
 * Upsert a fabric record (used by the CSV import pipeline).
 * Matches on articleCode; creates if not found.
 */
export async function upsertFabric(data: {
  name: string;
  description?: string;
  mill: string;
  season: string;
  composition: string;
  colourFamily: string;
  pattern: string;
  weightGm?: number;
  articleCode: string;
  upchargePence?: number;
  swatchImageUrl?: string;
  drapeImageUrl?: string;
  suitableFor: MtmCategory[];
  careInstructions?: string;
  isLimitedEdition?: boolean;
}): Promise<Fabric> {
  const row = await prisma.fabric.upsert({
    where: { articleCode: data.articleCode },
    update: {
      name: data.name,
      description: data.description,
      mill: data.mill,
      season: data.season,
      composition: data.composition,
      colourFamily: data.colourFamily,
      pattern: data.pattern,
      weightGm: data.weightGm,
      upchargePence: data.upchargePence ?? 0,
      swatchImageUrl: data.swatchImageUrl,
      drapeImageUrl: data.drapeImageUrl,
      suitableFor: data.suitableFor.join(','),
      careInstructions: data.careInstructions,
      isLimitedEdition: data.isLimitedEdition ?? false,
    },
    create: {
      name: data.name,
      description: data.description,
      mill: data.mill,
      season: data.season,
      composition: data.composition,
      colourFamily: data.colourFamily,
      pattern: data.pattern,
      weightGm: data.weightGm,
      articleCode: data.articleCode,
      upchargePence: data.upchargePence ?? 0,
      swatchImageUrl: data.swatchImageUrl,
      drapeImageUrl: data.drapeImageUrl,
      suitableFor: data.suitableFor.join(','),
      careInstructions: data.careInstructions,
      isLimitedEdition: data.isLimitedEdition ?? false,
    },
  });
  return rowToFabric(row);
}
