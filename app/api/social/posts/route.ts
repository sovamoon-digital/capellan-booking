import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthed } from '@/lib/auth';

export const runtime = 'nodejs';

const VALID_PLATFORMS = ['facebook', 'instagram'];

// GET — list posts (newest scheduled/created first)
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin
    .from('social_posts')
    .select('*')
    .order('scheduled_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — schedule a new post
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = await req.json();

  const platforms: string[] = Array.isArray(body.platforms)
    ? body.platforms.filter((p: string) => VALID_PLATFORMS.includes(p))
    : [];
  const mediaUrls: string[] = Array.isArray(body.media_urls) ? body.media_urls : [];
  const mediaPaths: string[] = Array.isArray(body.media_paths) ? body.media_paths : [];
  const caption: string = (body.caption || '').toString();
  const scheduledAt: string | null = body.scheduled_at || null;

  if (platforms.length === 0) {
    return NextResponse.json({ error: 'Selecciona al menos una red (Facebook o Instagram).' }, { status: 400 });
  }
  if (mediaUrls.length === 0) {
    return NextResponse.json({ error: 'Agrega al menos una imagen.' }, { status: 400 });
  }
  // Instagram requires a caption-bearing image but allows empty caption; FB too. No hard caption requirement.

  const status = scheduledAt ? 'scheduled' : 'draft';

  const { data, error } = await supabaseAdmin
    .from('social_posts')
    .insert({
      caption,
      platforms,
      media_urls: mediaUrls,
      media_paths: mediaPaths,
      media_type: 'image',
      scheduled_at: scheduledAt,
      status,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
