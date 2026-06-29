import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getMetaConfig, postPhotoToFacebook, postImageToInstagram } from '@/lib/meta';

export const runtime = 'nodejs';
export const maxDuration = 60; // headroom for IG container polling + multiple posts

// GET — publish all posts that are due. Fired every ~15 min by an external
// cron (GitHub Actions / cron-job.org) with the CRON_SECRET bearer token.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ skipped: true, reason: 'No Supabase in dev' });
  }

  const cfg = getMetaConfig();
  if (!cfg) {
    return NextResponse.json({ skipped: true, reason: 'Meta API no configurada (faltan META_PAGE_ID / META_PAGE_ACCESS_TOKEN)' });
  }

  const nowIso = new Date().toISOString();

  // Recover any rows a prior run claimed but never finished (process killed
  // mid-publish) so they get retried instead of being stuck on 'publishing'.
  const staleIso = new Date(Date.now() - 10 * 60_000).toISOString();
  await supabaseAdmin
    .from('social_posts')
    .update({ status: 'scheduled' })
    .eq('status', 'publishing')
    .lte('scheduled_at', staleIso);

  // Atomically claim due posts: flipping scheduled → publishing in a single
  // statement IS the lock, so two overlapping cron runs can't grab the same row.
  const { data: due, error } = await supabaseAdmin
    .from('social_posts')
    .update({ status: 'publishing' })
    .eq('status', 'scheduled')
    .lte('scheduled_at', nowIso)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!due || due.length === 0) return NextResponse.json({ published: 0 });

  const results: any[] = [];

  for (const post of due) {
    const imageUrl: string = post.media_urls?.[0]; // v1: single image
    let fbId: string | null = null;
    let igId: string | null = null;
    const errors: string[] = [];

    if (!imageUrl) {
      errors.push('Sin imagen');
    } else {
      if (post.platforms?.includes('facebook')) {
        try { fbId = await postPhotoToFacebook(cfg, imageUrl, post.caption || ''); }
        catch (e: any) { errors.push(`FB: ${e.message}`); }
      }
      if (post.platforms?.includes('instagram')) {
        try { igId = await postImageToInstagram(cfg, imageUrl, post.caption || ''); }
        catch (e: any) { errors.push(`IG: ${e.message}`); }
      }
    }

    const ok = errors.length === 0;
    await supabaseAdmin
      .from('social_posts')
      .update({
        status: ok ? 'published' : 'failed',
        fb_post_id: fbId,
        ig_post_id: igId,
        error: ok ? null : errors.join(' | '),
        published_at: ok ? new Date().toISOString() : null,
      })
      .eq('id', post.id);

    results.push({ id: post.id, ok, fbId, igId, errors });
  }

  const published = results.filter((r) => r.ok).length;
  return NextResponse.json({ published, failed: results.length - published, results });
}
