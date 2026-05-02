import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { mockBookings } from '@/lib/mockStore';
import { format, parseISO } from 'date-fns';

const DAY_MAP: Record<number, string> = { 0:'Sun',1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat' };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');
  const duration = parseInt(searchParams.get('duration') || '1');

  if (!dateStr) return NextResponse.json({ error: 'date required' }, { status: 400 });

  const date = parseISO(dateStr);
  const dayName = DAY_MAP[date.getDay()];

  const FALLBACK_AVAIL: Record<string,{is_open:boolean;open_time:string;close_time:string}> = {
    Mon:{is_open:true,open_time:'08:00',close_time:'17:00'},
    Tue:{is_open:true,open_time:'08:00',close_time:'17:00'},
    Wed:{is_open:true,open_time:'08:00',close_time:'17:00'},
    Thu:{is_open:true,open_time:'08:00',close_time:'17:00'},
    Fri:{is_open:true,open_time:'08:00',close_time:'17:00'},
    Sat:{is_open:true,open_time:'09:00',close_time:'14:00'},
    Sun:{is_open:false,open_time:'09:00',close_time:'13:00'},
  };

  let avail = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const res = await supabaseAdmin.from('availability').select('*').eq('day_of_week', dayName).single();
    avail = res.data;
  }
  if (!avail) avail = FALLBACK_AVAIL[dayName];

  if (!avail || !avail.is_open) return NextResponse.json([]);

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { data: blockedDate } = await supabaseAdmin
      .from('blocked_dates')
      .select('date')
      .eq('date', dateStr)
      .maybeSingle();
    if (blockedDate) return NextResponse.json([]);
  }

  const [openH, openM] = avail.open_time.split(':').map(Number);
  const [closeH, closeM] = avail.close_time.split(':').map(Number);
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  const allSlots: string[] = [];
  for (let m = openMins; m + duration * 60 <= closeMins; m += 60) {
    const h = Math.floor(m / 60).toString().padStart(2, '0');
    const min = (m % 60).toString().padStart(2, '0');
    allSlots.push(`${h}:${min}`);
  }

  let bookings = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const res = await supabaseAdmin.from('bookings').select('time, duration_hours').eq('date', dateStr).in('status', ['pending', 'confirmed']);
    bookings = res.data;
  } else {
    bookings = mockBookings.filter(b => b.date === dateStr && ['pending', 'confirmed'].includes(b.status));
  }

  const blocked = new Set<string>();
  (bookings || []).forEach((b: { time: string; duration_hours: number }) => {
    const [bh, bm] = b.time.split(':').map(Number);
    const startMins = bh * 60 + bm;
    for (let i = 0; i < b.duration_hours * 60; i += 60) {
      const sm = startMins + i;
      const h = Math.floor(sm / 60).toString().padStart(2, '0');
      const mn = (sm % 60).toString().padStart(2, '0');
      blocked.add(`${h}:${mn}`);
    }
  });

  const available = allSlots.filter(slot => {
    const [sh, sm] = slot.split(':').map(Number);
    const startMins = sh * 60 + sm;
    for (let i = 0; i < duration * 60; i += 60) {
      const checkMins = startMins + i;
      const h = Math.floor(checkMins / 60).toString().padStart(2, '0');
      const m = (checkMins % 60).toString().padStart(2, '0');
      if (blocked.has(`${h}:${m}`)) return false;
    }
    return true;
  });

  return NextResponse.json(available);
}
