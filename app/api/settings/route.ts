import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthed } from '@/lib/auth';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('settings').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const map: Record<string, string> = {};
  data.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  if (!await isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const updates = await req.json();
  const rows = Object.entries(updates).map(([key, value]) => ({ key, value: String(value) }));

  const { error } = await supabaseAdmin.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
