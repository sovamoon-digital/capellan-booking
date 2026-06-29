import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateWisdom } from '@/lib/anthropic';
import { renderWisdomPng } from '@/lib/render-wisdom';
import { nextBestSlots } from '@/lib/schedule';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 60; // Claude call + og render + sharp convert + upload

const BUCKET = 'social-media';

// GET — generate one "word of wisdom" post and schedule it at the next best slot.
// Fired Mon/Wed/Fri by an external cron (Bearer CRON_SECRET). The publisher cron
// then posts it to FB + IG. Fully automatic — no human step.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ skipped: true, reason: 'No Supabase in dev' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ skipped: true, reason: 'ANTHROPIC_API_KEY no configurada' });
  }

  // No-repeat rule: pass recent caption openings so Claude varies topic/angle.
  const { data: recentRows } = await supabaseAdmin
    .from('social_posts')
    .select('caption')
    .neq('caption', '')
    .order('created_at', { ascending: false })
    .limit(20);
  const recent = (recentRows || []).map((r) => ({ excerpt: (r.caption || '').slice(0, 120) }));

  try {
    const wisdom = await generateWisdom(recent);

    // Render hook onto the template, then convert PNG → JPEG (IG requires JPEG).
    const png = await renderWisdomPng(wisdom.hook);
    const jpeg = await sharp(png).jpeg({ quality: 88 }).toBuffer();

    const path = `wisdom/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, jpeg, { contentType: 'image/jpeg', upsert: false });
    if (upErr) return NextResponse.json({ error: `Upload: ${upErr.message}` }, { status: 500 });

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    const fullCaption = `${wisdom.caption}\n\n${wisdom.hashtags.join(' ')}`.trim();
    const scheduledAt = nextBestSlots(1)[0];

    const { data, error } = await supabaseAdmin
      .from('social_posts')
      .insert({
        caption: fullCaption,
        platforms: ['facebook', 'instagram'],
        media_urls: [pub.publicUrl],
        media_paths: [path],
        media_type: 'image',
        scheduled_at: scheduledAt,
        status: 'scheduled',
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, id: data.id, hook: wisdom.hook, scheduled_at: scheduledAt });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'generation failed' }, { status: 500 });
  }
}
