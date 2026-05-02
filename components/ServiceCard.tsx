'use client';

interface Service {
  id: string;
  name: string;
  duration_hours: number;
  price: number;
  icon: string;
}

interface Props {
  service: Service;
  selected: boolean;
  onSelect: (s: Service) => void;
}

export default function ServiceCard({ service, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(service)}
      className={`relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? 'border-[#D4A017] bg-[#D4A017]/10 shadow-lg shadow-[#D4A017]/20'
          : 'border-white/10 bg-white/5 hover:border-[#D4A017]/50 hover:bg-white/10'
      }`}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 bg-[#D4A017] rounded-full flex items-center justify-center text-[10px] text-black font-bold">✓</span>
      )}
      <div className="text-3xl mb-2">{service.icon}</div>
      <div className="font-bold text-white text-sm mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', letterSpacing: '0.02em' }}>
        {service.name}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[#D4A017] font-bold text-sm">${service.price}</span>
        <span className="text-white/40 text-xs">·</span>
        <span className="text-white/50 text-xs">{service.duration_hours}h</span>
      </div>
    </button>
  );
}
