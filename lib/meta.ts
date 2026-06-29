// Meta Graph API helpers — Facebook Page + Instagram Business publishing.
//
// Single token model: the Page access token (from a user who admins the
// Capellán Page, with `pages_manage_posts` + `instagram_content_publish`)
// is used for BOTH Facebook Page posts and Instagram publishing — the IG
// Business account is reached through the linked Page.
//
// Instagram is URL-based: Meta fetches the image from a public URL, so
// uploaded media must live in a public bucket (Supabase Storage).

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v21.0'}`;

export interface MetaConfig {
  pageId: string;
  igUserId: string;
  token: string;
}

/** Returns the Meta config from env, or null if not yet provisioned. */
export function getMetaConfig(): MetaConfig | null {
  const pageId = process.env.META_PAGE_ID;
  const igUserId = process.env.META_IG_USER_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) return null; // FB requires page+token; IG additionally needs igUserId
  return { pageId, igUserId: igUserId || '', token };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function graphGet(path: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${GRAPH}/${path}?${qs}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(json?.error?.message || `Graph API error (HTTP ${res.status})`);
  }
  return json;
}

async function graphPost(path: string, params: Record<string, string>): Promise<any> {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const msg = json?.error?.message || `Graph API error (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return json;
}

/** Post a single photo to the Facebook Page. Returns the post/photo id. */
export async function postPhotoToFacebook(
  cfg: MetaConfig,
  imageUrl: string,
  caption: string
): Promise<string> {
  const json = await graphPost(`${cfg.pageId}/photos`, {
    url: imageUrl,
    caption: caption || '',
    published: 'true',
    access_token: cfg.token,
  });
  return json.post_id || json.id;
}

/**
 * Publish a single image to Instagram. Two steps:
 *  1. Create a media container from the public image URL.
 *  2. Publish the container.
 * Returns the published media id.
 */
export async function postImageToInstagram(
  cfg: MetaConfig,
  imageUrl: string,
  caption: string
): Promise<string> {
  if (!cfg.igUserId) throw new Error('META_IG_USER_ID no está configurado');

  // Step 1 — container
  const container = await graphPost(`${cfg.igUserId}/media`, {
    image_url: imageUrl,
    caption: caption || '',
    access_token: cfg.token,
  });
  const creationId = container.id;
  if (!creationId) throw new Error('Instagram no devolvió un creation_id');

  // Step 1b — wait until the container is processed. For images it's usually
  // instant, but Graph can briefly return IN_PROGRESS; publishing too early errors.
  for (let attempt = 0; attempt < 6; attempt++) {
    const { status_code } = await graphGet(creationId, {
      fields: 'status_code',
      access_token: cfg.token,
    });
    if (status_code === 'FINISHED') break;
    if (status_code === 'ERROR') throw new Error('Instagram no pudo procesar la imagen (container ERROR)');
    if (attempt === 5) throw new Error('Instagram tardó demasiado en procesar la imagen');
    await sleep(2000);
  }

  // Step 2 — publish
  const published = await graphPost(`${cfg.igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: cfg.token,
  });
  return published.id;
}
