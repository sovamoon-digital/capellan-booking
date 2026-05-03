'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StatsBar from '@/components/admin/StatsBar';
import AppointmentsList from '@/components/admin/AppointmentsList';
import AvailabilityManager from '@/components/admin/AvailabilityManager';
import ServicesManager from '@/components/admin/ServicesManager';
import BlockedDates from '@/components/admin/BlockedDates';
import CalendarView from '@/components/admin/CalendarView';

type Tab = 'calendar' | 'appointments' | 'services' | 'availability' | 'blocked' | 'settings';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('calendar');
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [settings, setSettings] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const load = useCallback(async () => {
    const bookingsRes = await fetch('/api/bookings');
    if (bookingsRes.status === 401) { router.push('/admin/login'); return; }
    const [b, s, a, bl, st] = await Promise.all([
      bookingsRes.json(),
      fetch('/api/services').then(r => r.json()),
      fetch('/api/availability').then(r => r.json()),
      fetch('/api/blocked-dates').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]);
    if (Array.isArray(b)) setBookings(b);
    setServices(s);
    setAvailability(a);
    setBlockedDates(Array.isArray(bl) ? bl : []);
    setSettings(st);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const saveSettings = async () => {
    setSaving(true);
    await fetch('/api/settings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(settings) });
    setSaving(false); setSavedMsg('Saved!');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const logout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'calendar',     label: 'Calendario', icon: '🗓' },
    { key: 'appointments', label: 'Lista',       icon: '📋' },
    { key: 'services',     label: 'Servicios',  icon: '🛠' },
    { key: 'availability', label: 'Horarios',   icon: '📅' },
    { key: 'blocked',      label: 'Bloqueos',   icon: '🚫' },
    { key: 'settings',     label: 'Ajustes',    icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      {/* Header */}
      <div className="diagonal-stripe bg-[#111111] border-b border-[#D4A017]/20 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#D4A017]" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
              PANEL ADMINISTRATIVO
            </h1>
            <p className="text-white/30 text-xs">Capellan Auto Solution Express</p>
          </div>
          <button onClick={logout} className="text-xs text-white/30 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10">
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <StatsBar bookings={bookings} />

        {/* Tabs — scrollable on mobile */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 border border-white/10 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 py-2 px-3 sm:px-4 rounded-lg text-xs font-semibold transition-all ${
                tab === t.key ? 'bg-[#D4A017] text-black' : 'text-white/50 hover:text-white'
              }`}
              style={tab === t.key ? { fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em' } : {}}>
              <span className="text-base sm:text-sm leading-none">{t.icon}</span>
              <span className="text-[10px] sm:text-xs leading-none">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'calendar' && <CalendarView bookings={bookings} onRefresh={load} />}
        {tab === 'appointments' && <AppointmentsList bookings={bookings} onRefresh={load} />}
        {tab === 'services' && <ServicesManager services={services} onSaved={load} />}
        {tab === 'availability' && <AvailabilityManager availability={availability} onSaved={load} />}
        {tab === 'blocked' && <BlockedDates blockedDates={blockedDates} onSaved={load} />}
        {tab === 'settings' && (
          <div className="space-y-4">
            {[
              { key:'owner_name', label:'Nombre del Dueño', placeholder:'Capellan' },
              { key:'owner_whatsapp', label:'Número WhatsApp del Dueño', placeholder:'+1XXXXXXXXXX' },
              { key:'business_name', label:'Nombre del Negocio', placeholder:'Capellan Auto Solution Express' },
              { key:'admin_pin', label:'PIN de Administrador', placeholder:'1234', type:'password' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">{f.label}</label>
                <input
                  type={f.type || 'text'}
                  value={settings[f.key] || ''}
                  onChange={e => setSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A017] transition-colors"
                />
              </div>
            ))}
            <button onClick={saveSettings} disabled={saving}
              className="w-full py-3 rounded-xl bg-[#D4A017] hover:bg-[#F0C040] text-black font-bold text-sm transition-all disabled:opacity-50"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
              {savedMsg ? '✓ GUARDADO' : saving ? 'GUARDANDO...' : 'GUARDAR AJUSTES'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
