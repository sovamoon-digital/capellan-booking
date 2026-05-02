'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLogin() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    setLoading(false);
    if (res.ok) {
      router.push('/admin');
    } else {
      setError('PIN incorrecto. Intenta de nuevo.');
      setPin('');
    }
  };

  const pressKey = (k: string) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length < 6) setPin(p => p + k);
  };

  return (
    <div className="min-h-[100dvh] bg-[#1A1A1A] diagonal-stripe flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xs">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Capellán Auto Solution Express"
            width={160}
            height={160}
            className="drop-shadow-[0_0_20px_rgba(212,160,23,0.3)]"
            priority
          />
        </div>

        <h1 className="text-center text-2xl font-bold text-[#D4A017] mb-1"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
          ACCESO ADMIN
        </h1>
        <p className="text-center text-white/30 text-xs mb-8">Capellán Auto Solution Express</p>

        <form onSubmit={submit} className="space-y-5">
          {/* PIN dots display */}
          <div className="flex justify-center gap-3">
            {Array.from({ length: Math.max(pin.length, 4) }).map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full transition-all ${
                i < pin.length ? 'bg-[#D4A017] scale-110' : 'bg-white/15'
              }`} />
            ))}
          </div>

          {error && <p className="text-[#FCA5A5] text-sm text-center">{error}</p>}

          {/* Numeric keypad */}
          <div className="grid grid-cols-3 gap-3">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
              k === '' ? <div key={i} /> :
              <button
                key={i}
                type="button"
                onClick={() => pressKey(k)}
                className="aspect-square rounded-2xl bg-white/5 border border-white/10 text-white text-xl font-semibold hover:bg-white/10 hover:border-[#D4A017]/40 active:scale-95 transition-all"
                style={{ fontFamily: k === '⌫' ? 'system-ui' : 'Barlow Condensed, sans-serif' }}
              >
                {k}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!pin || loading}
            className="w-full py-3.5 rounded-2xl bg-[#D4A017] hover:bg-[#F0C040] text-black font-bold text-sm transition-all disabled:opacity-30 active:scale-95"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}
          >
            {loading ? 'VERIFICANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
}
