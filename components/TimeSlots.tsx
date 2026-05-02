'use client';

interface Props {
  slots: string[];
  selected: string | null;
  onSelect: (t: string) => void;
  loading: boolean;
}

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2,'0')} ${ampm}`;
}

export default function TimeSlots({ slots, selected, onSelect, loading }: Props) {
  if (loading) return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({length:6}).map((_,i)=>(
        <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
      ))}
    </div>
  );

  if (!slots.length) return (
    <div className="text-center py-8 text-white/40 text-sm">No hay horarios disponibles para este día.</div>
  );

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map(slot => (
        <button
          key={slot}
          onClick={() => onSelect(slot)}
          className={`py-2 px-1 rounded-lg text-sm font-semibold transition-all duration-150 ${
            selected === slot
              ? 'bg-[#D4A017] text-black shadow-lg shadow-[#D4A017]/30'
              : 'bg-white/5 border border-white/10 text-white hover:border-[#D4A017]/50 hover:bg-white/10'
          }`}
        >
          {fmt12(slot)}
        </button>
      ))}
    </div>
  );
}
