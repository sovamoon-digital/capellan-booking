'use client';

import { useState } from 'react';
import { format, parseISO, subHours } from 'date-fns';

interface Booking {
  id: string;
  service_name: string;
  duration_hours: number;
  date: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  car_make: string;
  car_model: string;
  car_year: string;
  notes: string;
  status: string;
  created_at: string;
}

interface Props {
  bookings: Booking[];
  onRefresh: () => void;
}

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-white/10 text-white/30 border-white/10',
};

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export default function AppointmentsList({ bookings, onRefresh }: Props) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const sorted = [...bookings].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : a.time < b.time ? -1 : 1
  );

  const visible = filter === 'active'
    ? sorted.filter(b => b.status !== 'cancelled' && b.status !== 'completed')
    : sorted;

  const cutoff = subHours(new Date(), 24);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id + status);
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setUpdating(null);
    onRefresh();
  };

  return (
    <div>
      {/* Filter toggle */}
      <div className="flex gap-1 mb-4 bg-white/5 rounded-lg p-1 w-fit border border-white/10">
        {(['active', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              filter === f ? 'bg-[#D4A017] text-black' : 'text-white/40 hover:text-white'
            }`}>
            {f === 'active' ? 'Activas' : 'Todas'}
          </button>
        ))}
      </div>

      {!visible.length ? (
        <div className="text-center py-12 text-white/30 text-sm">
          {filter === 'active' ? 'No hay citas activas.' : 'Aún no hay citas registradas.'}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(b => {
            const isNew = new Date(b.created_at) > cutoff;
            const carInfo = [b.car_year, b.car_make, b.car_model].filter(Boolean).join(' ');
            const isClosed = b.status === 'completed' || b.status === 'cancelled';

            return (
              <div key={b.id} className={`bg-white/5 border rounded-xl p-4 transition-colors ${
                isClosed ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-[#D4A017]/30'
              }`}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem' }}>
                      {b.customer_name}
                    </span>
                    {isNew && !isClosed && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C0200F] text-white">NEW</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[b.status] || STATUS_STYLES.pending}`}>
                      {STATUS_LABELS[b.status] || b.status}
                    </span>
                  </div>
                  <div className="text-[#D4A017] text-sm font-semibold">
                    {format(parseISO(b.date), 'MMM d')} · {fmt12(b.time)}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/60">
                  <span>🛠 {b.service_name}{b.duration_hours ? ` (${b.duration_hours}h)` : ''}</span>
                  {carInfo && <span>🚗 {carInfo}</span>}
                  <span>📱 {b.customer_phone}</span>
                  {b.customer_email && <span>📧 {b.customer_email}</span>}
                </div>

                {b.notes && <div className="mt-2 text-xs text-white/40 italic">📝 {b.notes}</div>}

                {/* Action buttons — only for active bookings */}
                {!isClosed && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => updateStatus(b.id, 'completed')}
                      disabled={!!updating}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 disabled:opacity-40 transition-all"
                    >
                      {updating === b.id + 'completed' ? '...' : '✓ Trabajo Listo'}
                    </button>
                    <button
                      onClick={() => updateStatus(b.id, 'cancelled')}
                      disabled={!!updating}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-[#C0200F]/20 hover:bg-[#C0200F]/30 text-red-400 border border-red-500/30 disabled:opacity-40 transition-all"
                    >
                      {updating === b.id + 'cancelled' ? '...' : '✗ Cancelar Cita'}
                    </button>
                  </div>
                )}

                {/* Restore option for cancelled */}
                {b.status === 'cancelled' && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => updateStatus(b.id, 'pending')}
                      disabled={!!updating}
                      className="text-xs text-white/30 hover:text-white transition-colors"
                    >
                      ↩ Restaurar cita
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
