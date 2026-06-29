import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthed } from '@/lib/auth';

export const runtime = 'nodejs';

const BUCKET = 'social-media';
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024; // IG image limit is ~8MB

function safeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-').replace(/-+/g, '-');
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const form = await req.formData();
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
  }

  const uploaded: { path: string; url: string }[] = [];
  for (const file of files) {
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: `Tipo no permitido: ${file.type}. Usa JPG, PNG o WEBP.` }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `${file.name} supera el límite de 8MB.` }, { status: 400 });
    }

    const mimeExt: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const ext = file.name.includes('.') ? file.name.split('.').pop() : (mimeExt[file.type] || 'jpg');
    const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName(file.name).replace(/\.[^.]+$/, '')}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (error) {
      return NextResponse.json({ error: `Error al subir: ${error.message}` }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    uploaded.push({ path, url: data.publicUrl });
  }

  return NextResponse.json({ uploaded });
}
