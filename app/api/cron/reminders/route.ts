import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendReminderWhatsApp } from '@/lib/whatsapp';
import { format, addDays } from 'date-fns';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Only Vercel cron (or manual test with secret) can trigger this
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Skip if Supabase isn't connected (local dev without env)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ skipped: true, reason: 'No Supabase in dev' });
  }

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('customer_name, customer_phone, service_name, date, time')
    .eq('date', tomorrow)
    .in('status', ['confirmed', 'pending']);

  if (error) {
    console.error('Reminders cron fetch error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0, date: tomorrow });
  }

  let sent = 0;
  const failures: string[] = [];

  for (const booking of bookings) {
    try {
      await sendReminderWhatsApp({
        customerName:  booking.customer_name,
        customerPhone: booking.customer_phone,
        service:       booking.service_name,
        date:          format(new Date(booking.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy'),
        time:          booking.time,
      });
      sent++;
    } catch (e) {
      console.error('Reminder failed for', booking.customer_phone, e);
      failures.push(booking.customer_phone);
    }
  }

  return NextResponse.json({ sent, failures, date: tomorrow });
}
