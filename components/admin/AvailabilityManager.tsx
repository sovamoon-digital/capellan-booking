'use client';

import { useState } from 'react';

interface AvailDay { id: string; day_of_week: string; is_open: boolean; open_time: string; close_time: string; }

interface Props { availability: AvailDay[]; onSaved: () => void; }

const ORDER = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const FULL: Record<string,string> = { Mon:'Lunes',Tue:'Martes',Wed:'Miércoles',Thu:'Jueves',Fri:'Viernes',Sat:'Sábado',Sun:'Domingo' };

export default function AvailabilityManager({ availability, onSaved }: Props) {
  const [days, setDays] = useState<AvailDay[]>(
    ORDER.map(d => availability.find(a => a.day_of_week === d) || { id:'', day_of_week:d, is_open:false, open_time:'08:00', close_time:'17:00' })
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (idx: number, patch: Partial<AvailDay>) =>
    setDays(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));

  const save = async () => {
    setSaving(true);
    await fetch('/api/availability', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(days) });
    setSaving(false); setSaved(true); onSaved();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-3">
      {days.map((day, i) => (
        <div key={day.day_of_week} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex-wrap sm:flex-nowrap">
          <div className="w-24 shrink-0">
            <button
              onClick={() => update(i, { is_open: !day.is_open })}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${day.is_open ? 'text-[#D4A017]' : 'text-white/30'}`}
            >
              <span className={`w-9 h-5 rounded-full relative transition-colors ${day.is_open ? 'bg-[#D4A017]' : 'bg-white/10'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${day.is_open ? 'left-4' : 'left-0.5'}`} />
              </span>
              {FULL[day.day_of_week]}
            </button>
          </div>
          {day.is_open ? (
            <div className="flex items-center gap-2 ml-auto text-sm">
              <input type="time" value={day.open_time} onChange={e => update(i, {open_time: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4A017]" />
              <span className="text-white/30">a</span>
              <input type="time" value={day.close_time} onChange={e => update(i, {close_time: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4A017]" />
            </div>
          ) : (
            <span className="ml-auto text-xs text-white/20">Cerrado</span>
          )}
        </div>
      ))}
      <button onClick={save} disabled={saving}
        className="w-full py-2.5 rounded-xl bg-[#D4A017] hover:bg-[#F0C040] text-black font-bold text-sm transition-all disabled:opacity-50"
        style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
        {saved ? '✓ GUARDADO' : saving ? 'GUARDANDO...' : 'GUARDAR HORARIOS'}
      </button>
    </div>
  );
}
