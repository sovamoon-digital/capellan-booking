# Social Auto-Posting — Setup Guide

How to take the social scheduler from **code deployed** to **live posting** on Facebook and Instagram for Capellán Auto Solution Express.

---

## 1. Overview

The feature lets an admin queue image posts and have them published automatically to the Capellán Facebook Page and Instagram account on a schedule.

**Flow:**

1. Admin opens **`/admin/social`** (Estudio Social), uploads an image, writes the caption, picks Facebook and/or Instagram, and chooses a time (manual or via the **"Próximo mejor horario"** suggestions).
2. The post is saved to the `social_posts` table with `status = scheduled` and a `scheduled_at` timestamp (stored in UTC). The image lives in the public **`social-media`** Supabase Storage bucket.
3. An external cron (**GitHub Actions**, every 15 min) calls **`GET /api/cron/social-publish`** with a bearer token.
4. The endpoint finds posts where `status = scheduled` AND `scheduled_at <= now`, publishes each via the **Meta Graph API**, and flips the row to `published` (or `failed`, with the error stored).

**v1 scope:** images only, **one image per post** (the publisher uses `media_urls[0]`). No video/carousel yet.

**Files involved:**

| File | Purpose |
|------|---------|
| `app/admin/social/page.tsx` | The scheduling UI |
| `app/api/social/upload/route.ts` | Image upload → Storage |
| `app/api/social/posts/route.ts` + `[id]/route.ts` | Create/list/edit/delete posts |
| `app/api/social/next-slot/route.ts` | Best-time suggestions |
| `app/api/cron/social-publish/route.ts` | The publisher (cron target) |
| `lib/meta.ts` | Graph API calls (FB photo + IG container→publish) |
| `lib/schedule.ts` | Best-time slot logic (DR timezone) |
| `supabase-social.sql` | DB table + Storage bucket |
| `.github/workflows/social-cron.yml` | The every-15-min trigger |

---

## 2. Prerequisites & Account Facts

- The **Capellán Facebook Page** is administered by the personal Facebook account **"Http Fiveoseven"** (the same account that also admins **Sovamoon Digital**). Use this account for every step below — it must have an **Admin** role on the Page.
- The **Instagram account must be a Business or Creator account**, and it **must be linked to the Capellán Facebook Page**. **Personal IG accounts cannot be published to via the API** — the API call will simply fail.

**How to check / convert the Instagram account:**

1. In the Instagram mobile app, go to the Capellán profile → **☰ menu → Settings and privacy**.
2. Tap **Account type and tools** → **Switch to professional account** (choose **Business**).
3. During setup (or later via **Account type and tools → Linked accounts / Page**), **connect it to the Capellán Facebook Page**.
4. Confirm the link from the Page side too: **Facebook Page → Settings → Linked accounts → Instagram** should show the Capellán IG.

---

## 3. Create the Meta Developer App

1. Go to **[developers.facebook.com](https://developers.facebook.com)** and log in as **Http Fiveoseven**.
2. **My Apps → Create App**.
3. App type: **Business**. Give it a name (e.g. `Capellan Social Publisher`) and attach it to the Capellán/Sovamoon **Business portfolio** if prompted.
4. In the app dashboard, **Add products**:
   - **Instagram** (Instagram Graph API / Instagram API with Instagram Login → use the **Instagram Graph API** for content publishing).
   - **Facebook Login** (needed to generate user/page tokens).
5. The permissions/scopes this integration needs:

   ```
   pages_show_list
   pages_read_engagement
   pages_manage_posts
   instagram_basic
   instagram_content_publish
   business_management
   ```

---

## 4. Get the IDs and the Token

Use the **Graph API Explorer** (developers.facebook.com → Tools → Graph API Explorer). Select your app, and add the scopes from §3.

### 4a. Find the Page ID and a Page token

1. In Graph API Explorer, run:
   ```
   GET /me/accounts
   ```
   This lists the Pages you admin, each with an `id` (that's **`META_PAGE_ID`**) and a Page **`access_token`**.
2. Copy the Capellán Page's `id` and its `access_token`.

### 4b. Find the Instagram Business Account ID

1. Run (replace `{page-id}`):
   ```
   GET /{page-id}?fields=instagram_business_account
   ```
2. The returned `instagram_business_account.id` is **`META_IG_USER_ID`**.
   - If this comes back empty, the IG account is **not a Business account** or **not linked to the Page** — fix §2 first.

### 4c. Make the token long-lived (or never-expiring)

Page tokens from the Explorer are **short-lived (~1 hour)**.

- **Long-lived (60 days):** exchange the token:
  ```
  GET https://graph.facebook.com/v21.0/oauth/access_token
      ?grant_type=fb_exchange_token
      &client_id={app-id}
      &client_secret={app-secret}
      &fb_exchange_token={short-lived-page-token}
  ```
  A long-lived **user** token + re-fetching `/me/accounts` yields a long-lived **Page** token. This still expires in ~60 days and must be regenerated.

- **Never-expiring (recommended): System User token.**
  1. Go to **[business.facebook.com](https://business.facebook.com) → Settings (Business Settings) → Users → System Users**.
  2. **Add** a system user (Admin role).
  3. **Assign assets**: give it access to the **Capellán Page** (and the IG account / app as needed).
  4. **Generate new token** → select the app → select the scopes from §3 → set token expiration to **Never**.
  5. Use this token as **`META_PAGE_ACCESS_TOKEN`**.

> **Why System User:** it does not expire, so the cron won't silently start failing in 60 days with a token-expired error. The 60-day long-lived token is fine for a quick test but is a maintenance trap for production.

---

## 5. App Review / Advanced Access — the Reality

`instagram_content_publish`, `pages_manage_posts`, and `pages_read_engagement` are **Advanced Access** permissions. In general, Advanced Access requires **Business Verification** + **App Review**.

There are two paths:

- **Fast path (covers this single-client case):** While the app is in **Development mode**, any user with a **role on the app** (Admin / Developer / Tester) can call these permissions against **assets they have a role on**. Since **Http Fiveoseven** admins both the app and the Capellán Page/IG, you can publish **without** submitting App Review. This is the recommended path for one owned business.
  - Make sure Http Fiveoseven (or the System User) is listed under the app's **Roles** and has the Page/IG assets assigned.

- **Production-review path:** Needed only if you ever want to publish to Pages/IG accounts you **don't** own (e.g. multiple external clients through one public app). Then: complete **Business Verification**, request **Advanced Access** for each permission, and submit **App Review** with a screencast. Approval can take days to weeks.

For Capellán alone, stay on the **fast path**.

---

## 6. Environment Variables

The code reads exactly these (verified against `lib/meta.ts` and the cron route):

```env
META_PAGE_ID=<the Capellán Page id from §4a>
META_IG_USER_ID=<the instagram_business_account id from §4b>
META_PAGE_ACCESS_TOKEN=<the System User / long-lived Page token from §4c>
META_GRAPH_VERSION=v21.0          # optional; defaults to v21.0 if unset
CRON_SECRET=<same value already used by the reminders cron>
```

**Where to set them:**

- **Production:** Vercel → the Capellán project → **Settings → Environment Variables** → add each for the **Production** environment → **redeploy**.
- **Local testing:** add the same lines to **`.env.local`**.

> `CRON_SECRET` is **already in use** by `/api/cron/reminders`. **Reuse the same value** — both cron endpoints check the identical secret.

**If the Meta vars are missing:** the portal still works in schedule-only mode, and `GET /api/cron/social-publish` returns:
```json
{ "skipped": true, "reason": "Meta API no configurada (faltan META_PAGE_ID / META_PAGE_ACCESS_TOKEN)" }
```
Nothing breaks — posts just sit in `scheduled` until the vars are set.

---

## 7. Database & Storage

Run **`supabase-social.sql`** in the **Supabase SQL editor** for the Capellán project. It:

- Creates the **`social_posts`** table (caption, platforms, media URLs/paths, `scheduled_at`, `status`, `fb_post_id`, `ig_post_id`, `error`, `published_at`).
- Creates the **`social-media`** Storage bucket and sets it **`public = true`** (idempotent).

> **The bucket MUST be public.** Instagram's Graph API does **not** accept raw image bytes — it **fetches the image from a public URL**. If the bucket is private, IG publishing fails. (Facebook would tolerate it, but IG will not.)

Verify in Supabase → **Storage** that `social-media` shows as **Public**.

---

## 8. External Cron Trigger

The publisher must be hit on a schedule. We use **GitHub Actions**: `.github/workflows/social-cron.yml`.

```yaml
on:
  schedule:
    - cron: '*/15 * * * *'   # every 15 min
  workflow_dispatch:          # manual run from the Actions tab
# curls https://capellanservicio.com/api/cron/social-publish
# with Authorization: Bearer ${{ secrets.CRON_SECRET }}
```

**Setup:**

1. In the GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**.
2. Name: **`CRON_SECRET`**, value: the **same** secret set in Vercel (§6).
3. Done — the workflow runs every 15 minutes once it's on the default branch. You can also trigger it manually from the **Actions** tab (**Run workflow**).

**Notes:**

- The endpoint decides what's "due," so the cron just needs to run *often enough* — exact firing time doesn't need to match the post time.
- **GitHub scheduled runs can be delayed a few minutes** under platform load. Posts may go out a few minutes after their slot — acceptable for this use case.
- **Alternative:** [cron-job.org](https://cron-job.org) (free) — create a job hitting the same URL every 15 min with an `Authorization: Bearer <CRON_SECRET>` header. Use this if you'd rather not rely on GitHub Actions timing.

---

## 9. Testing

**A. Manual endpoint test (no waiting):**

```bash
curl -i -H "Authorization: Bearer <CRON_SECRET>" \
  https://capellanservicio.com/api/cron/social-publish
```
- Wrong/missing token → `401 Unauthorized`.
- Meta vars unset → `{ "skipped": true, "reason": "Meta API no configurada ..." }`.
- Configured, nothing due → `{ "published": 0 }`.

**B. End-to-end:**

1. Go to **`/admin/social`**, upload a JPEG, write a caption, select **Facebook + Instagram**.
2. Pick a time **~15–20 minutes out** (use a manual `datetime-local`, or click a suggested slot).
3. Click **PROGRAMAR PUBLICACIÓN**. The post appears in the queue as **Programado**.
4. Wait for the cron (or hit the endpoint manually after the scheduled time passes).
5. Confirm the post appears on the **Facebook Page** and **Instagram**.
6. In Supabase, confirm the row flipped **`scheduled` → `published`**, and that **`fb_post_id`** and **`ig_post_id`** are populated. If it shows **`failed`**, read the **`error`** column and see §10.

---

## 10. Troubleshooting

| Symptom / Graph error | Cause | Fix |
|---|---|---|
| **OAuth error 190** ("token expired/invalid") | Page token expired (short or 60-day) | Regenerate; switch to a **System User token** (§4c) that never expires |
| **Error 10 / 200** ("permission" / "requires advanced access") | Missing scope or app role | Ensure scopes from §3 are granted; ensure the user/System User has a **role on the app** and the **Page/IG assets assigned** (§5 fast path) |
| IG container creation returns empty `instagram_business_account` | IG is **not a Business account** or **not linked** to the Page | Convert IG to Business and link to the Page (§2) |
| IG publish rejected — aspect ratio | IG accepts **4:5 to 1.91:1** | Crop the image to a supported ratio before uploading |
| IG publish rejected — media | Image must be **JPEG**, **< 8 MB**, and **reachable by Meta over the public URL** | Use JPEG under 8 MB; confirm the `social-media` bucket is **public** (§7) |
| `media_publish` fails right after container create | Publishing **too soon** before container is ready | For images this is usually instant; if it recurs, the media URL may be unreachable — re-check the public URL |
| Cron never fires | Missing GitHub secret or workflow not on default branch | Add **`CRON_SECRET`** repo secret (§8); merge the workflow to the deployed branch; test via **Run workflow** |
| Post stuck in `publishing` | A run claimed it but crashed mid-publish | Inspect the `error`/logs; manually reset the row's `status` to `scheduled` to retry |

---

## 11. Best Posting Schedule

The **"Próximo mejor horario"** button surfaces recommended slots computed in **`lib/schedule.ts`**, in **Dominican Republic local time** (fixed **UTC−04:00**, no daylight saving):

- **Times:** `SLOT_HOURS = [11, 14, 19]` → **11:00 AM, 2:00 PM, 7:00 PM**.
- **Days:** `OPEN_DOW = [1, 2, 3, 4, 5, 6]` → **Monday–Saturday**. **Sunday is skipped** because the shop is closed.
- Suggested slots always start at least **10 minutes from now**.

**To change the schedule:** edit `SLOT_HOURS` (hours, 24h) and/or `OPEN_DOW` (0 = Sunday … 6 = Saturday) in **`lib/schedule.ts`** and redeploy. Admins can always override with a manual date/time in the UI.
