'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import BookingSheet from '@/components/BookingSheet';

interface Service { id: string; name: string; duration_hours: number; price: number; icon: string; }

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<Service | null>(null);

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(setServices);
  }, []);

  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden bg-[#1A1A1A]">

      {/* Top 3/4 — Logo */}
      <div className="flex-[3] diagonal-stripe bg-[#111111] border-b border-[#D4A017]/20 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
          <Image src="/logo.png" alt="" width={480} height={480} className="opacity-[0.07] select-none scale-110" />
        </div>
        <div className="relative z-10 w-full h-full p-4">
          <Image
            src="/logo.png"
            alt="Capellán Auto Solution Express"
            fill
            className="object-contain drop-shadow-[0_0_40px_rgba(212,160,23,0.35)]"
            priority
          />
        </div>
      </div>

      {/* Bottom 1/4 — Service grid */}
      <div className="flex-[1] bg-[#1A1A1A] flex flex-col px-2 pt-2 pb-2 min-h-0">
        <p className="text-white/25 text-[9px] uppercase tracking-[0.18em] text-center mb-1.5 flex-shrink-0">
          Selecciona un servicio para reservar
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 flex-1 min-h-0">
          {services.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="flex items-center gap-2 md:gap-3 rounded-xl border border-white/10 bg-white/5 hover:border-[#D4A017]/60 hover:bg-[#D4A017]/10 active:scale-95 transition-all overflow-hidden h-full p-3 md:p-[8%]"
            >
              <span className="text-xl md:text-4xl leading-none flex-shrink-0">{s.icon}</span>
              <span
                className="text-white/90 truncate flex-shrink min-w-0"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(0.8rem, 2vw, 1.6rem)', letterSpacing: '0.02em', lineHeight: 1.1 }}
              >
                {s.name}
              </span>
              <span
                className="text-[#D4A017] flex-shrink-0 ml-auto text-right"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(0.75rem, 1.8vw, 1.5rem)', lineHeight: 1.1 }}
              >
                ${s.price}
                <span className="block text-white/40" style={{ fontSize: 'clamp(0.65rem, 1.4vw, 1rem)' }}>{s.duration_hours}h</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <BookingSheet service={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
