import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthed } from '@/lib/auth';
import { renderWisdomPng } from '@/lib/render-wisdom';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 60; // og render + sharp convert + upload

const BUCKET = 'social-media';

// POST { id, hook } — re-render the hook onto the template and swap the post's
// image. Removes the old object. Auth-guarded; blocked for published posts.
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = await req.json();
  const id = String(body.id || '');
  const hook = String(body.hook || '').trim();
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  if (!hook) return NextResponse.json({ error: 'Escribe el texto para la imagen' }, { status: 400 });

  const { data: row } = await supabaseAdmin
    .from('social_posts')
    .select('media_paths,status')
    .eq('id', id)
    .single();
  if (!row) return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
  if (row.status === 'published' || row.status === 'publishing') {
    return NextResponse.json({ error: 'No se puede regenerar una publicación ya publicada' }, { status: 400 });
  }

  try {
    const png = await renderWisdomPng(hook);
    const jpeg = await sharp(png).jpeg({ quality: 88 }).toBuffer();

    const path = `wisdom/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, jpeg, { contentType: 'image/jpeg', upsert: false });
    if (upErr) return NextResponse.json({ error: `Upload: ${upErr.message}` }, { status: 500 });

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    const { error: updErr } = await supabaseAdmin
      .from('social_posts')
      .update({ media_urls: [pub.publicUrl], media_paths: [path] })
      .eq('id', id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // Remove the previous image now that the row points at the new one.
    if (row.media_paths?.length) {
      await supabaseAdmin.storage.from(BUCKET).remove(row.media_paths);
    }

    return NextResponse.json({ ok: true, url: pub.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'render failed' }, { status: 500 });
  }
}
