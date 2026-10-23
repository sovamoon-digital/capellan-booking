import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getMetaConfig, getTokenStatus } from '@/lib/meta';

export const runtime = 'nodejs';

const DAY = 24 * 60 * 60_000;
const FAILED_LOOKBACK_DAYS = 7;
const OVERDUE_MINUTES = 60;
const MAX_DAYS_WITHOUT_POST = 5; // Tue/Fri cadence → longest normal gap is 4 days
const TOKEN_WARN_DAYS = 14;

// GET — daily health check, fired by cron-job.org (Bearer CRON_SECRET).
// Returns 503 with a list of problems if anything in the auto-posting chain is
// broken, so cron-job.org's failure notification emails us. Catches the
// failures that otherwise go unnoticed: Supabase paused, posts failing at Meta
// (the publisher still returns 200), posts not going out, token expiring.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ skipped: true, reason: 'No Supabase in dev' });
  }

  const problems: string[] = [];
  const info: Record<string, unknown> = {};
  const now = Date.now();

  // 1. Database reachable (a paused free-tier project fails here).
  const { error: dbErr } = await supabaseAdmin.from('social_posts').select('id', { head: true, count: 'exact' });
  if (dbErr) {
    problems.push(`Supabase no responde (¿proyecto pausado?): ${dbErr.message}`);
    return NextResponse.json({ ok: false, problems }, { status: 503 });
  }

  // 2. Posts that failed recently.
  const { data: failed } = await supabaseAdmin
    .from('social_posts')
    .select('id, scheduled_at, error')
    .eq('status', 'failed')
    .gte('scheduled_at', new Date(now - FAILED_LOOKBACK_DAYS * DAY).toISOString());
  for (const p of failed || []) {
    problems.push(`Publicación fallida ${p.id} (${p.scheduled_at}): ${p.error}`);
  }

  // 3. Posts past due that the publisher never picked up (publisher not running).
  const { data: overdue } = await supabaseAdmin
    .from('social_posts')
    .select('id, scheduled_at, status')
    .in('status', ['scheduled', 'publishing'])
    .lt('scheduled_at', new Date(now - OVERDUE_MINUTES * 60_000).toISOString());
  for (const p of overdue || []) {
    problems.push(`Publicación atrasada ${p.id}: sigue '${p.status}' desde ${p.scheduled_at} (¿cron de publicación detenido?)`);
  }

  // 4. Something actually went out recently (generator or publisher stopped).
  const { data: last } = await supabaseAdmin
    .from('social_posts')
    .select('published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  info.last_published_at = last?.published_at || null;
  if (!last?.published_at || now - new Date(last.published_at).getTime() > MAX_DAYS_WITHOUT_POST * DAY) {
    problems.push(`Nada publicado en más de ${MAX_DAYS_WITHOUT_POST} días (última: ${last?.published_at || 'nunca'})`);
  }

  // 5. Meta token valid and not about to expire.
  const cfg = getMetaConfig();
  if (!cfg) {
    problems.push('Meta API no configurada (faltan META_PAGE_ID / META_PAGE_ACCESS_TOKEN)');
  } else {
    const token = await getTokenStatus(cfg);
    info.token_expires_at = token.expiresAt?.toISOString() || 'never/unknown';
    if (!token.valid) {
      problems.push(`Token de Meta inválido: ${token.error}`);
    } else if (token.expiresAt && token.expiresAt.getTime() - now < TOKEN_WARN_DAYS * DAY) {
      problems.push(`Token de Meta vence el ${token.expiresAt.toISOString()} — reemplazar (SOCIAL-SETUP.md §4c)`);
    }
  }

  const ok = problems.length === 0;
  return NextResponse.json({ ok, problems, ...info }, { status: ok ? 200 : 503 });
}
