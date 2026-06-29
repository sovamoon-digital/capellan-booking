import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthed } from '@/lib/auth';

export const runtime = 'nodejs';

const BUCKET = 'social-media';

// PATCH — edit caption / reschedule / change platforms
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json();

  const patch: Record<string, any> = {};
  if (typeof body.caption === 'string') patch.caption = body.caption;
  if (Array.isArray(body.platforms)) patch.platforms = body.platforms;
  if ('scheduled_at' in body) {
    patch.scheduled_at = body.scheduled_at || null;
    patch.status = body.scheduled_at ? 'scheduled' : 'draft';
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('social_posts')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — remove the post and its media objects
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await ctx.params;

  const { data: row } = await supabaseAdmin
    .from('social_posts')
    .select('media_paths')
    .eq('id', id)
    .single();

  if (row?.media_paths?.length) {
    await supabaseAdmin.storage.from(BUCKET).remove(row.media_paths);
  }

  const { error } = await supabaseAdmin.from('social_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
