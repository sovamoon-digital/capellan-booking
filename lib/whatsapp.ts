import twilio from 'twilio';

export async function notifyOwnerWhatsApp(booking: {
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  carInfo: string;
}) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return;

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const msg = `🔧 *Nueva Cita - Capellan Auto Solution Express*

👤 *Cliente:* ${booking.customerName}
📱 *Teléfono:* ${booking.customerPhone}
🚗 *Vehículo:* ${booking.carInfo}
🛠 *Servicio:* ${booking.service}
📅 *Fecha:* ${booking.date}
🕐 *Hora:* ${booking.time}

Responde a este número para contactar al cliente.`;

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: 'whatsapp:' + process.env.OWNER_WHATSAPP_NUMBER,
    body: msg,
  });
}

export async function notifyCustomerWhatsApp(booking: {
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  reference: string;
}) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return;

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const msg = `✅ *¡Cita Confirmada! - Capellan Auto Solution Express*

Hola ${booking.customerName}, tu cita ha sido confirmada. 🎉

🛠 *Servicio:* ${booking.service}
📅 *Fecha:* ${booking.date}
🕐 *Hora:* ${booking.time}
🔖 *Referencia:* #${booking.reference}

Guarda este número de referencia para cambios o cancelaciones.

¡Gracias por elegirnos! 🚗`;

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: 'whatsapp:' + booking.customerPhone,
    body: msg,
  });
}
