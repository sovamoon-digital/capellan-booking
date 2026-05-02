'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  blockedDates: string[];
  onSaved: () => void;
}

export default function BlockedDates({ blockedDates, onSaved }: Props) {
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState('');

  const add = async () => {
    if (!selected) return;
    setSaving(true);
    await fetch('/api/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selected }),
    });
    setSaving(false);
    setSelected('');
    onSaved();
  };

  const remove = async (date: string) => {
    setRemoving(date);
    await fetch('/api/blocked-dates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });
    setRemoving('');
    onSaved();
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">
          Bloquear Fecha
        </label>
        <p className="text-white/30 text-xs mb-3">Las fechas bloqueadas no aparecerán disponibles para reservas.</p>
        <div className="flex gap-2">
          <input
            type="date"
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A017] transition-colors"
          />
          <button
            onClick={add}
            disabled={!selected || saving}
            className="px-5 py-2.5 rounded-xl bg-[#D4A017] hover:bg-[#F0C040] text-black font-bold text-sm disabled:opacity-40 transition-all"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
          >
            {saving ? '...' : 'BLOQUEAR'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          Fechas Bloqueadas ({blockedDates.length})
        </h3>
        {blockedDates.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
            <p className="text-white/20 text-sm">No hay fechas bloqueadas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedDates.map(date => (
              <div key={date} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#C0200F] flex-shrink-0" />
                  <span className="text-white text-sm capitalize">
                    {format(parseISO(date), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                  </span>
                </div>
                <button
                  onClick={() => remove(date)}
                  disabled={removing === date}
                  className="text-xs text-white/30 hover:text-[#C0200F] transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                >
                  {removing === date ? '...' : 'Eliminar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
