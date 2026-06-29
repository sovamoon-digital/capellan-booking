-- Social auto-posting — Supabase schema.
-- Run this in the Supabase SQL editor for the Capellán project.

create table if not exists social_posts (
  id           uuid primary key default gen_random_uuid(),
  caption      text not null default '',
  -- which networks to publish to, e.g. {facebook,instagram}
  platforms    text[] not null default '{}',
  -- public Storage URLs of the media (images for v1)
  media_urls   text[] not null default '{}',
  -- Storage object paths (for deletion/cleanup)
  media_paths  text[] not null default '{}',
  media_type   text not null default 'image',          -- image | video (future)
  scheduled_at timestamptz,                             -- when to publish (UTC)
  status       text not null default 'scheduled',       -- draft | scheduled | publishing | published | failed
  fb_post_id   text,
  ig_post_id   text,
  error        text,
  published_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_social_due
  on social_posts (status, scheduled_at);

-- The Storage bucket must be PUBLIC — Instagram's Graph API fetches the
-- image from a public URL. Create it once (idempotent):
insert into storage.buckets (id, name, public)
values ('social-media', 'social-media', true)
on conflict (id) do update set public = true;
