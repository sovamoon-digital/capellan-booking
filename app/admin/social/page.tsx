'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { drDatetimeLocalToUtc, formatDrLocal } from '@/lib/schedule';

type Media = { path: string; url: string };
type Post = {
  id: string;
  caption: string;
  platforms: string[];
  media_urls: string[];
  scheduled_at: string | null;
  status: string;
  error: string | null;
  published_at: string | null;
};

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  draft:      { label: 'Borrador',  cls: 'bg-white/10 text-white/60' },
  scheduled:  { label: 'Programado', cls: 'bg-[#D4A017]/20 text-[#D4A017]' },
  publishing: { label: 'Publicando', cls: 'bg-blue-500/20 text-blue-300' },
  published:  { label: 'Publicado',  cls: 'bg-green-500/20 text-green-300' },
  failed:     { label: 'Falló',      cls: 'bg-[#C0200F]/30 text-red-300' },
};

export default function SocialStudio() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [media, setMedia] = useState<Media | null>(null);
  const [caption, setCaption] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [scheduledIso, setScheduledIso] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/social/posts');
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    if (Array.isArray(data)) setPosts(data);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('files', file);
    const res = await fetch('/api/social/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { flash(data.error || 'Error al subir'); return; }
    setMedia(data.uploaded[0]);
  };

  const loadSlots = async () => {
    const res = await fetch('/api/social/next-slot?count=6');
    const data = await res.json();
    setSlots(data.slots || []);
  };

  const togglePlatform = (p: string) =>
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const onManualDate = (local: string) => setScheduledIso(local ? drDatetimeLocalToUtc(local) : '');

  const schedule = async () => {
    if (!media) { flash('Agrega una imagen primero.'); return; }
    if (platforms.length === 0) { flash('Selecciona Facebook y/o Instagram.'); return; }
    if (!scheduledIso) { flash('Elige una fecha y hora.'); return; }
    setSaving(true);
    const res = await fetch('/api/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caption,
        platforms,
        media_urls: [media.url],
        media_paths: [media.path],
        scheduled_at: scheduledIso,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { flash(data.error || 'Error al programar'); return; }
    setMedia(null); setCaption(''); setScheduledIso(''); setSlots([]);
    if (fileRef.current) fileRef.current.value = '';
    flash('¡Publicación programada!');
    load();
  };

  const del = async (id: string) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    await fetch(`/api/social/posts/${id}`, { method: 'DELETE' });
    load();
  };

  const gold = '#D4A017';

  return (
    <div className="min-h-screen bg-[#1A1A1A] pb-20">
      {/* Header */}
      <div className="diagonal-stripe bg-[#111111] border-b border-[#D4A017]/20 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#D4A017]" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
              ESTUDIO SOCIAL
            </h1>
            <p className="text-white/30 text-xs">Programa publicaciones en Facebook e Instagram</p>
          </div>
          <button onClick={() => router.push('/admin')} className="text-xs text-white/40 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10">
            ← Panel
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        {msg && (
          <div className="rounded-lg bg-[#D4A017]/15 border border-[#D4A017]/30 text-[#F0C040] text-sm px-4 py-2.5">{msg}</div>
        )}

        {/* Composer */}
        <div className="rounded-xl bg-[#222] border border-[#D4A017]/20 p-5 space-y-5">
          {/* Image */}
          <div>
            <label className="block text-white/70 text-sm mb-2 font-medium">Imagen</label>
            {media ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media.url} alt="preview" className="rounded-lg max-h-56 border border-white/10" />
                <button onClick={() => { setMedia(null); if (fileRef.current) fileRef.current.value=''; }}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#C0200F] text-white text-sm flex items-center justify-center shadow-lg">✕</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-36 rounded-lg border-2 border-dashed border-white/15 cursor-pointer hover:border-[#D4A017]/50 transition-colors">
                <span className="text-white/40 text-sm">{uploading ? 'Subiendo…' : '+ Subir imagen (JPG / PNG / WEBP, máx 8MB)'}</span>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-white/70 text-sm mb-2 font-medium">Texto / Descripción</label>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4}
              placeholder="Escribe el texto de la publicación…"
              className="w-full rounded-lg bg-[#1A1A1A] border border-white/15 text-white text-sm px-3 py-2.5 focus:border-[#D4A017] focus:outline-none resize-none" />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-white/70 text-sm mb-2 font-medium">Redes</label>
            <div className="flex gap-2">
              {[
                { k: 'facebook', label: 'Facebook', color: '#1877F2' },
                { k: 'instagram', label: 'Instagram', color: '#E1306C' },
              ].map((p) => {
                const on = platforms.includes(p.k);
                return (
                  <button key={p.k} onClick={() => togglePlatform(p.k)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                    style={{ borderColor: on ? p.color : 'rgba(255,255,255,0.15)', background: on ? p.color + '22' : 'transparent', color: on ? p.color : 'rgba(255,255,255,0.5)' }}>
                    {on ? '✓ ' : ''}{p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-white/70 text-sm mb-2 font-medium">Fecha y hora</label>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button onClick={loadSlots} className="px-3 py-2 rounded-lg text-sm border border-[#D4A017]/40 text-[#D4A017] hover:bg-[#D4A017]/10 transition-colors">
                ⚡ Próximo mejor horario
              </button>
              <input type="datetime-local" onChange={(e) => onManualDate(e.target.value)}
                className="rounded-lg bg-[#1A1A1A] border border-white/15 text-white text-sm px-3 py-2 focus:border-[#D4A017] focus:outline-none" />
            </div>
            {slots.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {slots.map((s) => (
                  <button key={s} onClick={() => setScheduledIso(s)}
                    className="px-3 py-1.5 rounded-full text-xs border transition-colors"
                    style={{ borderColor: scheduledIso === s ? gold : 'rgba(255,255,255,0.15)', color: scheduledIso === s ? gold : 'rgba(255,255,255,0.6)' }}>
                    {formatDrLocal(s)}
                  </button>
                ))}
              </div>
            )}
            {scheduledIso && (
              <p className="text-white/50 text-xs">Se publicará: <span className="text-[#D4A017]">{formatDrLocal(scheduledIso)}</span> (hora RD)</p>
            )}
          </div>

          <button onClick={schedule} disabled={saving || uploading}
            className="w-full py-3 rounded-lg font-bold text-[#1A1A1A] bg-[#D4A017] hover:bg-[#F0C040] transition-colors disabled:opacity-50"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', fontSize: '1.05rem' }}>
            {saving ? 'PROGRAMANDO…' : 'PROGRAMAR PUBLICACIÓN'}
          </button>
        </div>

        {/* Queue */}
        <div>
          <h2 className="text-white/80 font-bold mb-3" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
            COLA DE PUBLICACIONES
          </h2>
          {posts.length === 0 ? (
            <p className="text-white/30 text-sm">No hay publicaciones programadas todavía.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => {
                const st = STATUS_STYLE[p.status] || STATUS_STYLE.draft;
                return (
                  <div key={p.id} className="flex gap-3 rounded-xl bg-[#222] border border-white/10 p-3">
                    {p.media_urls?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.media_urls[0]} alt="" className="w-16 h-16 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        {p.platforms?.map((pl) => (
                          <span key={pl} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50">{pl === 'facebook' ? 'FB' : 'IG'}</span>
                        ))}
                        {p.scheduled_at && <span className="text-xs text-white/40">{formatDrLocal(p.scheduled_at)}</span>}
                      </div>
                      <p className="text-white/70 text-sm truncate">{p.caption || <span className="text-white/30 italic">sin texto</span>}</p>
                      {p.error && <p className="text-red-400 text-xs mt-1 truncate">{p.error}</p>}
                    </div>
                    <button onClick={() => del(p.id)} className="text-white/30 hover:text-[#C0200F] transition-colors text-sm flex-shrink-0">✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
