import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthed } from '@/lib/auth';

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json([]);
  const { data, error } = await supabaseAdmin
    .from('blocked_dates')
    .select('date')
    .order('date');
  if (error) return NextResponse.json([]);
  return NextResponse.json((data || []).map((r: { date: string }) => r.date));
}

export async function POST(req: NextRequest) {
  if (!await isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { date } = await req.json();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ success: true });
  const { error } = await supabaseAdmin
    .from('blocked_dates')
    .upsert({ date }, { onConflict: 'date' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { date } = await req.json();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ success: true });
  const { error } = await supabaseAdmin
    .from('blocked_dates')
    .delete()
    .eq('date', date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
