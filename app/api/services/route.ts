import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthed } from '@/lib/auth';

const FALLBACK_SERVICES = [
  { id: 's1', name: 'Cambio de Aceite',       duration_hours: 1, price: 49,  icon: '🛢',  active: true },
  { id: 's2', name: 'Rotación de Gomas',      duration_hours: 1, price: 35,  icon: '🔄',  active: true },
  { id: 's3', name: 'Servicio de Frenos',     duration_hours: 2, price: 180, icon: '🔧',  active: true },
  { id: 's4', name: 'Inspección Completa',    duration_hours: 2, price: 99,  icon: '🔍',  active: true },
  { id: 's5', name: 'Recarga de A/C',         duration_hours: 2, price: 129, icon: '❄️',  active: true },
  { id: 's6', name: 'Diagnóstico de Motor',   duration_hours: 1, price: 89,  icon: '⚙️',  active: true },
  { id: 's7', name: 'Servicio de Transmisión',duration_hours: 3, price: 220, icon: '🔩',  active: true },
  { id: 's8', name: 'Correa de Distribución', duration_hours: 4, price: 380, icon: '⛓️', active: true },
];

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json(FALLBACK_SERVICES);
  }
  const { data, error } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq('active', true)
    .order('created_at');
  if (error) return NextResponse.json(FALLBACK_SERVICES);
  return NextResponse.json(data?.length ? data : FALLBACK_SERVICES);
}

export async function POST(req: NextRequest) {
  if (!await isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, id, ...fields } = body;

  if (action === 'delete') {
    const { error } = await supabaseAdmin.from('services').update({ active: false }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (id) {
    const { data, error } = await supabaseAdmin.from('services').update(fields).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabaseAdmin.from('services').insert(fields).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
