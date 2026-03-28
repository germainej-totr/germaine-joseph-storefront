import { NextRequest, NextResponse } from 'next/server';
import { listFabrics, listFabricMills } from '@/lib/fabric/fabric-service';
import type { FabricFilters, FabricSeason, FabricColourFamily, FabricPattern } from '@/types/fabric';
import type { MtmCategory } from '@/types/mtm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const filters: FabricFilters = {};

    const mill = searchParams.get('mill');
    if (mill) filters.mill = mill;

    const season = searchParams.get('season');
    if (season) filters.season = season as FabricSeason;

    const colourFamily = searchParams.get('colour_family');
    if (colourFamily) filters.colourFamily = colourFamily as FabricColourFamily;

    const pattern = searchParams.get('pattern');
    if (pattern) filters.pattern = pattern as FabricPattern;

    const category = searchParams.get('category');
    if (category) filters.category = category as MtmCategory;

    const q = searchParams.get('q');
    if (q) filters.searchQuery = q;

    const minWeight = searchParams.get('min_weight_gm');
    if (minWeight) filters.minWeightGm = parseInt(minWeight, 10);

    const maxWeight = searchParams.get('max_weight_gm');
    if (maxWeight) filters.maxWeightGm = parseInt(maxWeight, 10);

    const [fabrics, mills] = await Promise.all([
      listFabrics(filters),
      listFabricMills(),
    ]);

    return NextResponse.json({ fabrics, mills, total: fabrics.length });
  } catch (error) {
    console.error('[/api/fabrics] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch fabrics' }, { status: 500 });
  }
}
