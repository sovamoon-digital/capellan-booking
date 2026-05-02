import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { notifyOwnerWhatsApp, notifyCustomerWhatsApp } from '@/lib/whatsapp';
import { isAdminAuthed } from '@/lib/auth';
import { formatDRPhone } from '@/lib/phone';
import { mockBookings } from '@/lib/mockStore';
import { format, parseISO } from 'date-fns';

export async function GET(req: NextRequest) {
  if (!await isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json([...mockBookings].sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : a.time < b.time ? -1 : 1
    ));
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await req.json();
  const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!id || !allowed.includes(status)) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const booking = mockBookings.find(b => b.id === id);
    if (booking) booking.status = status;
    return NextResponse.json({ success: true });
  }

  const { error } = await supabaseAdmin.from('bookings').update({ status }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    service_id, service_name, date, time, duration_hours,
    customer_name, customer_email,
    car_make, car_model, car_year, notes,
  } = body;

  const customer_phone = formatDRPhone(body.customer_phone || '');

  if (!customer_name || !customer_phone || !date || !time || !service_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const mockRef = Date.now().toString(36).toUpperCase().slice(-6);
    const booking = {
      id: 'DEMO-' + mockRef,
      service_id, service_name, date, time, duration_hours,
      customer_name, customer_phone, customer_email,
      car_make, car_model, car_year, notes,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    mockBookings.push(booking);
    return NextResponse.json(booking, { status: 201 });
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      service_id, service_name, date, time, duration_hours,
      customer_name, customer_phone, customer_email,
      car_make, car_model, car_year, notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const reference = String(data.id).slice(-6).toUpperCase();
  const formattedDate = format(parseISO(date), 'EEEE, MMMM d, yyyy');
  const carInfo = [car_year, car_make, car_model].filter(Boolean).join(' ') || 'No especificado';

  try {
    await notifyOwnerWhatsApp({ customerName: customer_name, customerPhone: customer_phone, service: service_name, date: formattedDate, time, carInfo });
  } catch (e) {
    console.error('WhatsApp owner notify failed:', e);
  }

  try {
    await notifyCustomerWhatsApp({ customerName: customer_name, customerPhone: customer_phone, service: service_name, date: formattedDate, time, reference });
  } catch (e) {
    console.error('WhatsApp customer notify failed:', e);
  }

  return NextResponse.json(data, { status: 201 });
}
