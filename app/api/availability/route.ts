import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthed } from '@/lib/auth';

const FALLBACK_AVAILABILITY = [
  { id:'a1', day_of_week:'Mon', is_open:true,  open_time:'08:00', close_time:'17:00' },
  { id:'a2', day_of_week:'Tue', is_open:true,  open_time:'08:00', close_time:'17:00' },
  { id:'a3', day_of_week:'Wed', is_open:true,  open_time:'08:00', close_time:'17:00' },
  { id:'a4', day_of_week:'Thu', is_open:true,  open_time:'08:00', close_time:'17:00' },
  { id:'a5', day_of_week:'Fri', is_open:true,  open_time:'08:00', close_time:'17:00' },
  { id:'a6', day_of_week:'Sat', is_open:true,  open_time:'09:00', close_time:'14:00' },
  { id:'a7', day_of_week:'Sun', is_open:false, open_time:'09:00', close_time:'13:00' },
];

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json(FALLBACK_AVAILABILITY);
  }
  const { data, error } = await supabaseAdmin
    .from('availability')
    .select('*')
    .order('id');
  if (error) return NextResponse.json(FALLBACK_AVAILABILITY);
  return NextResponse.json(data?.length ? data : FALLBACK_AVAILABILITY);
}

export async function POST(req: NextRequest) {
  if (!await isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const days = await req.json();
  const updates = Array.isArray(days) ? days : [days];

  const results = await Promise.all(
    updates.map(d =>
      supabaseAdmin
        .from('availability')
        .upsert({ day_of_week: d.day_of_week, is_open: d.is_open, open_time: d.open_time, close_time: d.close_time }, { onConflict: 'day_of_week' })
    )
  );

  const err = results.find(r => r.error);
  if (err?.error) return NextResponse.json({ error: err.error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
