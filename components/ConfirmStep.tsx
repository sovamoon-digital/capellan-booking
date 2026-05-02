'use client';

import { format, parseISO } from 'date-fns';
import type { CustomerData } from './CustomerForm';

interface Service { name: string; price: number; duration_hours: number; icon: string; }

interface Props {
  service: Service;
  date: Date;
  time: string;
  customer: CustomerData;
  onConfirm: () => void;
  loading: boolean;
}

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2,'0')} ${ampm}`;
}

export default function ConfirmStep({ service, date, time, customer, onConfirm, loading }: Props) {
  const carInfo = [customer.car_year, customer.car_make, customer.car_model].filter(Boolean).join(' ');

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#D4A017]/30 bg-[#D4A017]/5 p-5 space-y-3">
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <span className="text-2xl">{service.icon}</span>
          <div>
            <div className="text-white font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem' }}>{service.name}</div>
            <div className="text-[#D4A017] text-sm font-semibold">${service.price} · {service.duration_hours}h</div>
          </div>
        </div>
        <Row label="📅 Fecha" value={format(date, 'EEEE, d \'de\' MMMM yyyy')} />
        <Row label="🕐 Hora" value={fmt12(time)} />
        <Row label="👤 Nombre" value={customer.name} />
        <Row label="📱 Teléfono" value={customer.phone} />
        {customer.email && <Row label="📧 Correo" value={customer.email} />}
        {carInfo && <Row label="🚗 Vehículo" value={carInfo} />}
        {customer.notes && <Row label="📝 Notas" value={customer.notes} />}
      </div>

      <button
        onClick={onConfirm}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-[#C0200F] hover:bg-[#8B0000] text-white font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#C0200F]/30 active:scale-[0.98]"
        style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
      >
        {loading ? 'RESERVANDO...' : 'CONFIRMAR CITA'}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-white/50 shrink-0">{label}</span>
      <span className="text-white text-right">{value}</span>
    </div>
  );
}
