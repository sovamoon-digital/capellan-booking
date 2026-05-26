'use client';

import { useEffect } from 'react';
import BookingWizard from './BookingWizard';

interface Service { id: string; name: string; duration_hours: number; price: number; icon: string; }

interface Props {
  service: Service;
  onClose: () => void;
}

export default function BookingSheet({ service, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-[#1A1A1A] rounded-t-3xl border-t border-[#D4A017]/20 max-h-[92vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{service.icon}</span>
            <div>
              <p className="text-white font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', letterSpacing: '0.03em' }}>
                {service.name}
              </p>
              <p className="text-white/40 text-xs">${service.price} · {service.duration_hours}h</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-all flex items-center justify-center text-xl leading-none"
          >
            ×
          </button>
        </div>
        {/* Wizard */}
        <div className="px-5 py-6 pb-12">
          <BookingWizard initialService={service} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
