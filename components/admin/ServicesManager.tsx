'use client';

import { useState } from 'react';

interface Service { id: string; name: string; duration_hours: number; price: number; icon: string; active: boolean; }
interface Props { services: Service[]; onSaved: () => void; }

const blank = { name: '', duration_hours: 1, price: 0, icon: '🔧' };
const inp = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4A017] transition-colors";

const ICONS = [
  '🔧','🔩','⚙️','🛢','🔋','🛞','🚗','🚙','🏎',
  '🔍','🔦','💡','❄️','🌡','💨','🔥','⚡','🪛',
  '🛠','⛽','🪝','🔑','🪜','📋','🧰','🧲','🪤',
  '⛓️','🔗','🪚','🔨','🪣','🧴','💧','🫧','✨',
];

export default function ServicesManager({ services, onSaved }: Props) {
  const [editing, setEditing] = useState<(Service | typeof blank) | null>(null);
  const [saving, setSaving] = useState(false);
  const [showIcons, setShowIcons] = useState(false);

  const save = async () => {
    if (!editing || !('name' in editing) || !editing.name.trim()) return;
    setSaving(true);
    await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify('id' in editing && editing.id ? editing : { ...editing }),
    });
    setSaving(false); setEditing(null); setShowIcons(false); onSaved();
  };

  const del = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
    onSaved();
  };

  return (
    <div className="space-y-3">
      {services.map(s => (
        <div key={s.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <span className="text-2xl">{s.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">{s.name}</div>
            <div className="text-white/40 text-xs">${s.price} · {s.duration_hours}h</div>
          </div>
          <button onClick={() => { setEditing(s); setShowIcons(false); }} className="text-xs text-[#D4A017] hover:text-[#F0C040] transition-colors px-2">Editar</button>
          <button onClick={() => del(s.id, s.name)} className="text-xs text-white/30 hover:text-[#C0200F] transition-colors px-2">Eliminar</button>
        </div>
      ))}

      {editing ? (
        <div className="bg-white/5 border border-[#D4A017]/30 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-bold text-[#D4A017]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {'id' in editing && editing.id ? 'EDITAR SERVICIO' : 'AGREGAR SERVICIO'}
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-white/40 mb-1 block">Nombre</label>
              <input
                className={`${inp} w-full`}
                value={editing.name}
                onChange={e => setEditing(prev => ({ ...prev!, name: e.target.value }))}
                placeholder="Cambio de Aceite"
              />
            </div>

            {/* Icon picker */}
            <div className="col-span-2">
              <label className="text-xs text-white/40 mb-1 block">Ícono</label>
              <button
                type="button"
                onClick={() => setShowIcons(v => !v)}
                className="flex items-center gap-3 w-full bg-white/5 border border-white/10 hover:border-[#D4A017]/50 rounded-lg px-3 py-2 transition-colors"
              >
                <span className="text-2xl leading-none">{editing.icon}</span>
                <span className="text-white/40 text-xs flex-1 text-left">
                  {showIcons ? 'Cerrar selector' : 'Toca para cambiar el ícono'}
                </span>
                <span className="text-white/20 text-xs">{showIcons ? '▲' : '▼'}</span>
              </button>

              {showIcons && (
                <div className="mt-2 p-3 bg-[#111] border border-white/10 rounded-xl">
                  <div className="grid grid-cols-9 gap-1">
                    {ICONS.map(ic => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => { setEditing(prev => ({ ...prev!, icon: ic })); setShowIcons(false); }}
                        className={`aspect-square rounded-lg text-xl flex items-center justify-center transition-all ${
                          editing.icon === ic
                            ? 'bg-[#D4A017]/30 border border-[#D4A017]/60'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Duración (hrs)</label>
              <input
                type="number" min="1" max="8"
                className={`${inp} w-full`}
                value={editing.duration_hours}
                onChange={e => setEditing(prev => ({ ...prev!, duration_hours: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Precio ($)</label>
              <input
                type="number" min="0"
                className={`${inp} w-full`}
                value={editing.price}
                onChange={e => setEditing(prev => ({ ...prev!, price: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(null); setShowIcons(false); }}
              className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={save} disabled={saving}
              className="flex-1 py-2 rounded-lg bg-[#D4A017] hover:bg-[#F0C040] text-black text-sm font-bold transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {saving ? 'GUARDANDO...' : 'GUARDAR'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setEditing(blank); setShowIcons(false); }}
          className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-white/40 hover:border-[#D4A017]/40 hover:text-[#D4A017] text-sm transition-colors"
        >
          + Agregar Servicio
        </button>
      )}
    </div>
  );
}
