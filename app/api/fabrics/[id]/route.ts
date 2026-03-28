import { NextRequest, NextResponse } from 'next/server';
import { getFabricById } from '@/lib/fabric/fabric-service';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id } = params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid fabric id' }, { status: 400 });
  }

  try {
    const fabric = await getFabricById(id);
    if (!fabric) {
      return NextResponse.json({ error: 'Fabric not found' }, { status: 404 });
    }
    return NextResponse.json({ fabric });
  } catch (error) {
    console.error(`[/api/fabrics/${id}] GET error:`, error);
    return NextResponse.json({ error: 'Failed to fetch fabric' }, { status: 500 });
  }
}
