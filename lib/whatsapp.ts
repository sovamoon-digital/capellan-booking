import twilio from 'twilio';

const TEMPLATES = {
  cita_nueva:       'HX548d77cf937958a3e6135675617c5505',
  cita_confirmada:  'HXddf474f91eab63c4b39b4ffbe143d7e2',
  cita_cancelada:   'HXb3e617f8e2ea44a25a8c809a6da6b5bf',
  cita_recuerdo:    'HX82d333147c881b092856e5b7e77d8f7a',
};

function getClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
}

function ready(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

async function send(to: string, contentSid: string, vars: Record<string, string>) {
  const client = getClient();
  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: 'whatsapp:' + to,
    contentSid,
    contentVariables: JSON.stringify(vars),
  });
}

// Notify owner of a new booking
export async function notifyOwnerWhatsApp(booking: {
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  carInfo: string;
}) {
  if (!ready()) return;
  await send(process.env.OWNER_WHATSAPP_NUMBER!, TEMPLATES.cita_nueva, {
    '1': booking.customerName,
    '2': booking.customerPhone,
    '3': booking.carInfo,
    '4': booking.service,
    '5': booking.date,
    '6': booking.time,
  });
}

// Confirm booking with customer
export async function notifyCustomerWhatsApp(booking: {
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  reference: string;
}) {
  if (!ready()) return;
  await send(booking.customerPhone, TEMPLATES.cita_confirmada, {
    '1': booking.customerName,
    '2': booking.service,
    '3': booking.date,
    '4': booking.time,
    '5': booking.reference,
  });
}

// Notify customer of cancellation
export async function notifyCancellationWhatsApp(booking: {
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
}) {
  if (!ready()) return;
  await send(booking.customerPhone, TEMPLATES.cita_cancelada, {
    '1': booking.customerName,
    '2': booking.date,
    '3': booking.time,
  });
}

// Send appointment reminder to customer
export async function sendReminderWhatsApp(booking: {
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
}) {
  if (!ready()) return;
  await send(booking.customerPhone, TEMPLATES.cita_recuerdo, {
    '1': booking.customerName,
    '2': booking.service,
    '3': booking.date,
    '4': booking.time,
  });
}
