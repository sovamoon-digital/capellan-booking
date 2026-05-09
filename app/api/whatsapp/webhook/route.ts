import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import twilio from 'twilio';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const from = formData.get('From') as string;
  const body = formData.get('Body') as string;

  if (!from || !body) {
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Save to Supabase
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    await supabaseAdmin.from('whatsapp_messages').insert({
      from_number: from,
      message_body: body,
      status: 'unread',
    }).then(({ error }) => {
      if (error) console.error('Supabase insert error:', error);
    });
  }

  // Forward to owner
  const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
  if (ownerNumber && fromNumber && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const senderDisplay = from.replace('whatsapp:', '');
    await client.messages.create({
      from: fromNumber,
      to: `whatsapp:${ownerNumber}`,
      body: `📩 *Mensaje entrante de ${senderDisplay}:*\n\n${body}`,
    }).catch(e => console.error('WhatsApp forward error:', e));
  }

  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}
