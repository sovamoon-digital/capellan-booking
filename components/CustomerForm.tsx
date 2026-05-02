'use client';

import { formatDRPhone, isValidDRPhone } from '@/lib/phone';

export interface CustomerData {
  name: string;
  phone: string;
  email: string;
  car_make: string;
  car_model: string;
  car_year: string;
  notes: string;
}

interface Props {
  data: CustomerData;
  onChange: (d: CustomerData) => void;
}

const inp = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#D4A017] focus:bg-white/8 transition-colors";
const lbl = "block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5";

export default function CustomerForm({ data, onChange }: Props) {
  const set = (k: keyof CustomerData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...data, [k]: e.target.value });

  const handlePhoneBlur = () => {
    if (data.phone) {
      onChange({ ...data, phone: formatDRPhone(data.phone) });
    }
  };

  const phoneValid = !data.phone || isValidDRPhone(data.phone);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Nombre Completo *</label>
          <input
            className={inp}
            placeholder="Juan Pérez"
            value={data.name}
            onChange={set('name')}
            autoComplete="name"
          />
        </div>
        <div>
          <label className={lbl}>Teléfono (WhatsApp) *</label>
          <input
            className={`${inp} ${!phoneValid ? 'border-red-500/60' : ''}`}
            placeholder="809-000-0000"
            value={data.phone}
            onChange={set('phone')}
            onBlur={handlePhoneBlur}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
          />
          {!phoneValid && (
            <p className="text-red-400 text-xs mt-1">Ingresa un número DR válido (809, 829 ó 849)</p>
          )}
          {data.phone && phoneValid && (
            <p className="text-white/30 text-xs mt-1">{formatDRPhone(data.phone)}</p>
          )}
        </div>
      </div>

      <div>
        <label className={lbl}>Correo Electrónico</label>
        <input
          className={inp}
          placeholder="juan@ejemplo.com"
          value={data.email}
          onChange={set('email')}
          type="email"
          inputMode="email"
          autoComplete="email"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={lbl}>Año</label>
          <input
            className={inp}
            placeholder="2020"
            value={data.car_year}
            onChange={set('car_year')}
            maxLength={4}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className={lbl}>Marca</label>
          <input className={inp} placeholder="Toyota" value={data.car_make} onChange={set('car_make')} />
        </div>
        <div>
          <label className={lbl}>Modelo</label>
          <input className={inp} placeholder="Corolla" value={data.car_model} onChange={set('car_model')} />
        </div>
      </div>

      <div>
        <label className={lbl}>Notas (opcional)</label>
        <textarea
          className={`${inp} resize-none`}
          rows={3}
          placeholder="Detalles adicionales..."
          value={data.notes}
          onChange={set('notes')}
        />
      </div>
    </div>
  );
}
