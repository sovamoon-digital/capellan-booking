'use client';

import { useState, useEffect } from 'react';
import {
  format, startOfWeek, eachDayOfInterval, addDays,
  addWeeks, subWeeks, parseISO, isSameDay, isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';

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
}

interface Props {
  bookings: Booking[];
  onRefresh: () => void;
}

const ROW_H = 72;
const START_HOUR = 8;
const END_HOUR = 18;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const STATUS_BLOCK: Record<string, string> = {
  pending:   'bg-amber-500/25 border-amber-400/50 text-amber-100',
  confirmed: 'bg-blue-500/25 border-blue-400/50 text-blue-100',
  completed: 'bg-emerald-500/25 border-emerald-400/50 text-emerald-100',
  cancelled: 'bg-white/5 border-white/10 text-white/20',
};

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-white/10 text-white/30 border-white/10',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado',
  completed: 'Completado', cancelled: 'Cancelado',
};

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function endTime(time: string, hours: number) {
  const [h, m] = time.split(':').map(Number);
  const endH = h + hours;
  return fmt12(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
}

export default function CalendarView({ bookings, onRefresh }: Props) {
  const [rangeStart, setRangeStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selected, setSelected] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState('');
  const [daysCount, setDaysCount] = useState(7);

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 640;
      setDaysCount(mobile ? 3 : 7);
      // On mobile anchor to today, on desktop anchor to week start
      if (mobile) setRangeStart(new Date());
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const days = eachDayOfInterval({ start: rangeStart, end: addDays(rangeStart, daysCount - 1) });
  const totalH = HOURS.length * ROW_H;

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id + status);
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setUpdating('');
    setSelected(null);
    onRefresh();
  };

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setRangeStart(d => addDays(d, -daysCount))}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs font-semibold transition-all"
        >
          ← Anterior
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-sm" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
            {format(rangeStart, "d MMM", { locale: es }).toUpperCase()} — {format(addDays(rangeStart, daysCount - 1), "d MMM yyyy", { locale: es }).toUpperCase()}
          </p>
          <button
            onClick={() => setRangeStart(daysCount === 7 ? startOfWeek(new Date(), { weekStartsOn: 1 }) : new Date())}
            className="text-[10px] text-[#D4A017]/50 hover:text-[#D4A017] transition-colors"
          >
            {daysCount === 7 ? 'Esta semana' : 'Hoy'}
          </button>
        </div>
        <button
          onClick={() => setRangeStart(d => addDays(d, daysCount))}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs font-semibold transition-all"
        >
          Siguiente →
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto -mx-1 pb-2">
        <div style={{ minWidth: 520 }}>

          {/* Day headers */}
          <div className="grid border-b border-white/10" style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}>
            <div />
            {days.map(day => {
              const now = isToday(day);
              return (
                <div key={day.toISOString()} className={`text-center py-2 ${now ? 'bg-[#D4A017]/10 rounded-t-lg' : ''}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${now ? 'text-[#D4A017]' : 'text-white/30'}`}
                    style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {format(day, 'EEE', { locale: es })}
                  </p>
                  <p className={`text-lg font-bold leading-tight ${now ? 'text-[#D4A017]' : 'text-white/60'}`}
                    style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {format(day, 'd')}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time rows + booking blocks */}
          <div className="grid" style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}>

            {/* Hour labels column */}
            <div className="relative" style={{ height: totalH }}>
              {HOURS.map(h => (
                <div
                  key={h}
                  style={{ top: (h - START_HOUR) * ROW_H + 4 }}
                  className="absolute right-1 text-[9px] text-white/20 leading-none text-right"
                >
                  {h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map(day => {
              const now = isToday(day);
              const dayBookings = bookings.filter(b => {
                try { return isSameDay(parseISO(b.date), day); } catch { return false; }
              });

              return (
                <div
                  key={day.toISOString()}
                  className={`relative border-l border-white/5 ${now ? 'bg-[#D4A017]/[0.03]' : ''}`}
                  style={{ height: totalH }}
                >
                  {/* Hour lines */}
                  {HOURS.map(h => (
                    <div
                      key={h}
                      style={{ top: (h - START_HOUR) * ROW_H }}
                      className="absolute inset-x-0 border-t border-white/[0.06]"
                    />
                  ))}

                  {/* Booking blocks */}
                  {dayBookings.map(b => {
                    const [bh, bm] = b.time.split(':').map(Number);
                    const top = (bh + bm / 60 - START_HOUR) * ROW_H;
                    const height = Math.max((b.duration_hours || 1) * ROW_H - 3, 22);
                    const isCancelled = b.status === 'cancelled';

                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelected(b)}
                        style={{ top, height, left: 2, right: 2 }}
                        className={`absolute rounded-lg border px-1.5 py-1 text-left overflow-hidden transition-all hover:brightness-125 hover:z-10 ${STATUS_BLOCK[b.status] || STATUS_BLOCK.pending} ${isCancelled ? 'opacity-40' : ''}`}
                      >
                        <p className="font-bold leading-tight truncate"
                          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.7rem', letterSpacing: '0.02em' }}>
                          {b.customer_name}
                        </p>
                        {height >= 42 && (
                          <p className="truncate opacity-75" style={{ fontSize: '0.6rem' }}>
                            {b.service_name}
                          </p>
                        )}
                        {height >= 60 && (
                          <p className="opacity-50" style={{ fontSize: '0.58rem' }}>
                            {fmt12(b.time)} – {endTime(b.time, b.duration_hours || 1)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Booking detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col" onClick={() => setSelected(null)}>
          <div className="flex-1 bg-black/70 backdrop-blur-sm" />
          <div
            className="bg-[#1A1A1A] rounded-t-3xl border-t border-[#D4A017]/20 max-h-[88vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-5 pt-3 pb-10">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em' }}>
                    {selected.customer_name}
                  </h3>
                  <p className="text-[#D4A017] text-sm font-semibold capitalize">
                    {format(parseISO(selected.date), "EEEE d 'de' MMMM yyyy", { locale: es })}
                  </p>
                </div>
                <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[selected.status] || STATUS_BADGE.pending}`}>
                  {STATUS_LABELS[selected.status] || selected.status}
                </span>
              </div>

              {/* Detail cards */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">

                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-white/35 text-[10px] uppercase tracking-wider mb-1">Servicio</p>
                  <p className="text-white font-semibold text-sm leading-tight">{selected.service_name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{selected.duration_hours}h duración</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-white/35 text-[10px] uppercase tracking-wider mb-1">Horario</p>
                  <p className="text-white font-semibold text-sm">{fmt12(selected.time)}</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    Fin aprox. {endTime(selected.time, selected.duration_hours || 1)}
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-white/35 text-[10px] uppercase tracking-wider mb-1">Teléfono</p>
                  <p className="text-white font-semibold text-sm">{selected.customer_phone}</p>
                  {selected.customer_email
                    ? <p className="text-white/40 text-xs mt-0.5 truncate">{selected.customer_email}</p>
                    : <p className="text-white/20 text-xs mt-0.5">Sin correo</p>
                  }
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-white/35 text-[10px] uppercase tracking-wider mb-1">Vehículo</p>
                  {(selected.car_make || selected.car_model || selected.car_year) ? (
                    <p className="text-white font-semibold text-sm leading-tight">
                      {[selected.car_year, selected.car_make, selected.car_model].filter(Boolean).join(' ')}
                    </p>
                  ) : (
                    <p className="text-white/20 text-sm">No especificado</p>
                  )}
                </div>

              </div>

              {selected.notes && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
                  <p className="text-white/35 text-[10px] uppercase tracking-wider mb-1">Notas del Cliente</p>
                  <p className="text-white/80 text-sm">{selected.notes}</p>
                </div>
              )}

              {/* Actions */}
              {selected.status !== 'completed' && selected.status !== 'cancelled' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(selected.id, 'completed')}
                    disabled={!!updating}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 disabled:opacity-40 transition-all"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
                  >
                    {updating === selected.id + 'completed' ? '...' : '✓ TRABAJO LISTO'}
                  </button>
                  <button
                    onClick={() => updateStatus(selected.id, 'cancelled')}
                    disabled={!!updating}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#C0200F]/20 hover:bg-[#C0200F]/30 text-red-400 border border-red-500/30 disabled:opacity-40 transition-all"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
                  >
                    {updating === selected.id + 'cancelled' ? '...' : '✗ CANCELAR CITA'}
                  </button>
                </div>
              )}

              {selected.status === 'cancelled' && (
                <button
                  onClick={() => updateStatus(selected.id, 'pending')}
                  disabled={!!updating}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-white/40 border border-white/10 disabled:opacity-40 transition-all"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
                >
                  ↩ RESTAURAR CITA
                </button>
              )}

              {selected.status === 'completed' && (
                <div className="text-center py-2 text-emerald-400/60 text-sm">
                  ✓ Este trabajo ha sido completado
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
