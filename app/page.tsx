import Image from 'next/image';
import Link from 'next/link';

const FACEBOOK_URL = 'https://facebook.com/capellanauto';
const INSTAGRAM_URL = 'https://instagram.com/capellanauto';
const EMAIL = 'hello@capellanservicio.com';

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function IconEmail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 7 10-7" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden bg-[#1A1A1A]">

      {/* Logo section */}
      <div className="flex-[3] diagonal-stripe bg-[#111111] border-b border-[#D4A017]/20 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
          <Image src="/logo.png" alt="" width={480} height={480} className="opacity-[0.07] select-none scale-110" />
        </div>
        <div className="relative z-10 w-full h-full p-6 md:p-10">
          <Image
            src="/logo.png"
            alt="Capellán Auto Solution Express"
            fill
            className="object-contain drop-shadow-[0_0_40px_rgba(212,160,23,0.35)]"
            priority
          />
        </div>
      </div>

      {/* Content section */}
      <div className="flex-[2] bg-[#1A1A1A] flex flex-col items-center justify-between px-6 pt-6 pb-5">

        {/* Tagline */}
        <div className="text-center">
          <p
            className="text-white/80 text-lg md:text-2xl"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em' }}
          >
            Taller mecánico de confianza
          </p>
          <p className="text-white/30 text-xs md:text-sm tracking-widest uppercase mt-0.5">
            Santo Domingo, República Dominicana
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/booking"
          className="w-full max-w-sm py-4 rounded-2xl bg-[#D4A017] hover:bg-[#F0C040] active:scale-95 text-black font-bold text-center tracking-widest transition-all"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', fontSize: '1.1rem' }}
        >
          RESERVA TU CITA
        </Link>

        {/* Social + Email */}
        <div className="flex items-center gap-6">
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="text-white/40 hover:text-[#D4A017] transition-colors"
          >
            <IconFacebook />
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-white/40 hover:text-[#D4A017] transition-colors"
          >
            <IconInstagram />
          </a>
          <a
            href={`mailto:${EMAIL}`}
            aria-label="Email"
            className="text-white/40 hover:text-[#D4A017] transition-colors"
          >
            <IconEmail />
          </a>
        </div>

        {/* Built by */}
        <p className="text-white/20 text-[10px] tracking-wide">
          Built by{' '}
          <a
            href="https://sovamoon.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D4A017] hover:text-[#F0C040] transition-colors"
          >
            Sovamoon
          </a>
        </p>

      </div>

      {/* CHATBOT: drop Sovamoon embed <Script> here when ready */}

    </main>
  );
}
