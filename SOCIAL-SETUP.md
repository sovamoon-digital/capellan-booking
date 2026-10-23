# Social Auto-Posting — Setup Guide

How to take the social scheduler from **code deployed** to **live posting** on Facebook and Instagram for Capellán Auto Solution Express.

---

## 1. Overview

The feature lets an admin queue image posts and have them published automatically to the Capellán Facebook Page and Instagram account on a schedule.

**Flow:**

1. Admin opens **`/admin/social`** (Estudio Social), uploads an image, writes the caption, picks Facebook and/or Instagram, and chooses a time (manual or via the **"Próximo mejor horario"** suggestions).
2. The post is saved to the `social_posts` table with `status = scheduled` and a `scheduled_at` timestamp (stored in UTC). The image lives in the public **`social-media`** Supabase Storage bucket.
3. An external cron (**cron-job.org**, every 15 min) calls **`GET /api/cron/social-publish`** with a bearer token.
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
| `app/api/cron/social-generate/route.ts` | Auto-generates a "wisdom" post (Tue/Fri) |
| `.github/workflows/social-*.yml` | Manual-run backups only (schedule lives on cron-job.org, §8) |

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

## 8. External Cron Trigger (cron-job.org)

Three endpoints run on a schedule, all on **[cron-job.org](https://cron-job.org)** (free).

| Job | URL | Schedule (America/Santo_Domingo) |
|---|---|---|
| **Capellán – Publish** | `https://capellanservicio.com/api/cron/social-publish` | Every 15 minutes |
| **Capellán – Generate** | `https://capellanservicio.com/api/cron/social-generate` | **Tuesday + Friday, 9:00 AM** |
| **Capellán – Health** | `https://capellanservicio.com/api/cron/health` | Daily, 8:00 PM (§8f) |

> **Why not GitHub Actions:** GitHub silently disables scheduled workflows after **60 days without a commit**. That is what stopped auto-posting on **Aug 26, 2026**: the last commit was Jun 29, and both workflows were turned off after Aug 28. The `.github/workflows/social-*.yml` files are kept for **manual runs only** (Actions tab → Run workflow). **Do not re-add `schedule:` to them**, or GitHub and cron-job.org will both generate posts.

### 8a. Before you start: clear stuck posts

Any post still `scheduled` with a **past** date gets published on the **first publisher run**. After any outage, check for these in the Supabase SQL editor **before** enabling the jobs:

```sql
select id, caption, scheduled_at from social_posts
where status = 'scheduled' and scheduled_at < now()
order by scheduled_at;
```

Then either delete each one or move it to a future slot (times are UTC; DR = UTC-4):

```sql
delete from social_posts where id = '<id>';
-- or
update social_posts set scheduled_at = '<YYYY-MM-DD>T23:00:00Z' where id = '<id>';  -- 7:00 PM DR
```

Pick the **7:00 PM** slot (`T23:00:00Z`) on generator days (Tue/Fri). The generator already takes **11:00 AM** on those days, and two posts in the same slot look like spam.

> **Oct 2026 recovery (done):** the stuck Aug 28 clutch post (`d49bd0d2-b4a1-4397-92b7-860424d9b47c`, "Un embrague que patina…") was rescheduled to **Tue Oct 27, 7:00 PM DR** (`2026-10-27T23:00:00Z`). The first Tuesday back has two posts: the new generated one at 11:00 AM and this one at 7:00 PM.

### 8b. Create the account

1. Sign up at **cron-job.org** with the Sovamoon ops email, so failure alerts go somewhere someone reads.
2. **Settings → Timezone** → **America/Santo_Domingo**.

### 8c. Job 1: Publisher

**Create cronjob**:

1. **Common** tab:
   - Title: `Capellán – Publish`
   - URL: `https://capellanservicio.com/api/cron/social-publish`
   - Enable job: **on**
   - Execution schedule: **Every 15 minutes**
   - Notify me: on **failure**, and **when the job is disabled automatically**
2. **Advanced** tab:
   - Request method: **GET**
   - Headers → **Add**: key `Authorization`, value `Bearer <CRON_SECRET>`. Use the same value as Vercel (§6), and keep the space after `Bearer`.
   - Timezone: **America/Santo_Domingo**
   - Timeout: the maximum allowed (30s on the free plan)
3. **Create**, then use **Test run**. Expect HTTP 200 with `{"published":0}` (or `published: N` if something was due).

### 8d. Job 2: Generator (Tue/Fri)

**Create cronjob**:

1. **Common** tab:
   - Title: `Capellán – Generate`
   - URL: `https://capellanservicio.com/api/cron/social-generate`
   - Execution schedule: **Custom**. Days of week: **Tuesday, Friday**. Hours: **9**. Minutes: **0**. Days of month / months: **every**.
     (Crontab equivalent: `0 9 * * 2,5` in America/Santo_Domingo, or `0 13 * * 2,5` in UTC.)
   - Notify me: on **failure**, and **when disabled**
2. **Advanced** tab: same **GET**, same `Authorization: Bearer <CRON_SECRET>` header, same timezone.
3. **Create**. **Don't Test run this one** unless you want an extra post. Each run creates and schedules a real post.

Each 9:00 AM run schedules its post at the next best slot (§11), which is normally **11:00 AM the same day**. The publisher picks it up within 15 minutes after that.

### 8e. Verify

- After a day, open each job → **History**. Publisher runs should be **200** every 15 min.
- After the first Tuesday: in Supabase, a new `social_posts` row should go `scheduled` → `published`, with both `fb_post_id` and `ig_post_id` set.

### 8f. Job 3: Health monitor (daily)

Jobs 1 and 2 alert only when their *own* request fails. Most real outages don't look like that: the publisher returns 200 even when Meta rejects a post, and a paused Supabase just makes the site fall back to its backup data. `GET /api/cron/health` checks the whole chain and returns **503** (so cron-job.org emails you) if any of these are true:

| Check | Means |
|---|---|
| Supabase query fails | Database paused or down. **Booking site is also broken.** → Resume project |
| A post has `status = failed` in the last 7 days | Meta rejected it. The `error` text is in the response |
| A post is still `scheduled`/`publishing` more than 60 min past its time | Publisher job (Job 1) isn't running |
| Nothing published in more than 5 days | Generator (Job 2) or the whole chain stopped |
| Meta token invalid, or expires within 14 days | Replace it (§4c) before posting stops |

**Setup.** Create it like Job 1, with the same GET method, `Authorization: Bearer <CRON_SECRET>` header and timezone:
- Title: `Capellán – Health`
- URL: `https://capellanservicio.com/api/cron/health`
- Schedule: **Custom**, every day, hour **20**, minute **0** (after the 7 PM slot has had time to publish)
- Notify: on **failure** and **when disabled**. If it offers a failure-count threshold, set it to **1**: this job runs only once a day.

**Test run is safe** (it only reads). A healthy response looks like:
```json
{ "ok": true, "problems": [], "last_published_at": "...", "token_expires_at": "never/unknown" }
```
`token_expires_at: "never/unknown"` is what a System User token shows. A date there means you're on a 60-day token. Replace it now, not when the alert fires.

> **When you first set it up**, it will report "Nada publicado en más de 5 días" until the first post goes out. That's expected. To avoid the extra alerts, create this job after the first successful publish.

**When an alert arrives:** open the URL with the header (or use Test run on the job) and read `problems`. Each entry says what broke.

**Notes:**

- The publisher decides what's "due," so it only needs to run *often enough*. Exact firing time doesn't matter.
- **Timeouts:** the free plan cuts the HTTP request off at 30s. The publisher normally takes under 15s, but a run that's polling an IG container can take longer. If History shows a timeout, look at the row in Supabase before assuming it failed: Vercel usually finishes the function even after cron-job.org disconnects.
- **Auto-disable:** cron-job.org disables a job after many consecutive failures (e.g. `CRON_SECRET` rotated in Vercel but not here → 401s). That's why the "when disabled" notification matters. **If you rotate `CRON_SECRET`, update both job headers.**
- **Supabase free plan pauses the database** after about a week without activity. The publisher's 15-min database queries are what keep it awake. In Oct 2026 the project was found paused after the GitHub crons died, and the site was serving the hardcoded backup services list (ids `s1`–`s8`) with bookings failing. If the publisher job ever stops, expect the database to pause about a week later. Fix: Supabase dashboard → **Resume project**. Permanent fix: upgrade the project to **Supabase Pro**.

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
| Posts stop going out / cron never fires | cron-job.org job disabled (repeated failures) or wrong `Authorization` header (401) | Check job **History** on cron-job.org; fix the header to match Vercel's `CRON_SECRET`; re-enable the job (§8) |
| Post stuck in `publishing` | A run claimed it but crashed mid-publish | Inspect the `error`/logs; manually reset the row's `status` to `scheduled` to retry |

---

## 11. Best Posting Schedule

The **"Próximo mejor horario"** button surfaces recommended slots computed in **`lib/schedule.ts`**, in **Dominican Republic local time** (fixed **UTC−04:00**, no daylight saving):

- **Times:** `SLOT_HOURS = [11, 14, 19]` → **11:00 AM, 2:00 PM, 7:00 PM**.
- **Days:** `OPEN_DOW = [1, 2, 3, 4, 5, 6]` → **Monday–Saturday**. **Sunday is skipped** because the shop is closed.
- Suggested slots always start at least **10 minutes from now**.

**To change the schedule:** edit `SLOT_HOURS` (hours, 24h) and/or `OPEN_DOW` (0 = Sunday … 6 = Saturday) in **`lib/schedule.ts`** and redeploy. Admins can always override with a manual date/time in the UI.