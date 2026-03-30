import { NextResponse } from 'next/server';

import { AccountHistoryService } from '@/lib/account/AccountHistoryService';

export async function GET() {
  try {
    const history = await AccountHistoryService.getCurrentOwnerHistory(10);
    return NextResponse.json({ ok: true, history });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const status = message === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}