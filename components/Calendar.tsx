'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isToday, isSameDay, getDay, addMonths, subMonths } from 'date-fns';

const DAY_MAP: Record<number, string> = { 0:'Sun',1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat' };

interface AvailDay {
  day_of_week: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

interface Props {
  availability: AvailDay[];
  selected: Date | null;
  onSelect: (d: Date) => void;
  blockedDates?: string[];
  duration?: number;
}

export default function Calendar({ availability, selected, onSelect, blockedDates = [], duration = 1 }: Props) {
  const [month, setMonth] = useState(new Date());

  const availMap = new Map(availability.map(a => [a.day_of_week, a]));
  const blockedSet = new Set(blockedDates);
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startPad = getDay(startOfMonth(month));
  const today = new Date(); today.setHours(0,0,0,0);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonth(subMonths(month, 1))} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">‹</button>
        <span className="text-white font-semibold" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
          {format(month, 'MMMM yyyy').toUpperCase()}
        </span>
        <button onClick={() => setMonth(addMonths(month, 1))} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">›</button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {['Do','Lu','Ma','Mi','Ju','Vi','Sá'].map(d => (
          <div key={d} className="text-center text-[11px] font-bold text-white/30 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dayName = DAY_MAP[getDay(day)];
          const dateStr = format(day, 'yyyy-MM-dd');
          const avail = availMap.get(dayName);
          const isPast = isBefore(day, today);
          const isClosed = !avail?.is_open;
          const isBlocked = blockedSet.has(dateStr);

          // Gray out days where the working window is shorter than the service duration
          const windowTooShort = avail?.is_open
            ? (() => {
                const [oh, om] = avail.open_time.split(':').map(Number);
                const [ch, cm] = avail.close_time.split(':').map(Number);
                return (ch * 60 + cm) - (oh * 60 + om) < duration * 60;
              })()
            : false;

          const isDisabled = isPast || isClosed || isBlocked || windowTooShort;
          const isSel = selected && isSameDay(day, selected);
          const isNow = isToday(day);

          const disabledTitle = isBlocked
            ? 'Fecha no disponible'
            : windowTooShort
            ? `Día muy corto para un servicio de ${duration}h`
            : undefined;

          return (
            <button
              key={day.toISOString()}
              disabled={isDisabled}
              onClick={() => onSelect(day)}
              title={disabledTitle}
              className={`aspect-square rounded-lg text-sm font-medium transition-all duration-150 ${
                isDisabled
                  ? isBlocked
                    ? 'text-[#C0200F]/40 cursor-not-allowed line-through'
                    : 'text-white/20 cursor-not-allowed'
                  : isSel
                  ? 'bg-[#D4A017] text-black font-bold shadow-lg shadow-[#D4A017]/30'
                  : isNow
                  ? 'border border-[#D4A017]/50 text-[#D4A017] hover:bg-[#D4A017]/20'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
