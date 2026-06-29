import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/auth';
import { nextBestSlots } from '@/lib/schedule';

export const runtime = 'nodejs';

// GET — returns the next recommended posting slots (UTC ISO strings).
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const count = Math.min(12, Math.max(1, Number(req.nextUrl.searchParams.get('count')) || 6));
  return NextResponse.json({ slots: nextBestSlots(count) });
}
