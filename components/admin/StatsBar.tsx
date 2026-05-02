'use client';

import { useMemo } from 'react';
import { format, isToday, isThisWeek, parseISO } from 'date-fns';

interface Booking { id: string; date: string; created_at: string; }

interface Props { bookings: Booking[]; }

export default function StatsBar({ bookings }: Props) {
  const stats = useMemo(() => {
    const total = bookings.length;
    const todayCount = bookings.filter(b => isToday(parseISO(b.date))).length;
    const weekCount = bookings.filter(b => isThisWeek(parseISO(b.date), { weekStartsOn: 1 })).length;
    return { total, todayCount, weekCount };
  }, [bookings]);

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label: 'Total de Citas', value: stats.total, icon: '📋' },
        { label: 'Citas de Hoy', value: stats.todayCount, icon: '📅' },
        { label: 'Esta Semana', value: stats.weekCount, icon: '📆' },
      ].map(s => (
        <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">{s.icon}</div>
          <div className="text-3xl font-bold text-[#D4A017]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{s.value}</div>
          <div className="text-white/40 text-xs mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
