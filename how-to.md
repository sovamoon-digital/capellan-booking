# Capellan Auto — Configuration Guide

---

## WhatsApp Notifications (Twilio)

Two messages are sent on every booking:
- **Owner** receives new appointment details
- **Customer** receives booking confirmation with reference number

> **Agency note:** Capellán does NOT need its own Twilio account. Sovamoon's existing account
> is used. Only a dedicated phone number and WhatsApp sender are provisioned per client.
> All charges bill to Sovamoon; pass through to client as part of the monthly package.

---

### Step 1 — Get Sovamoon's Twilio Credentials

1. Log in to Twilio at [console.twilio.com](https://console.twilio.com) using the Sovamoon account
2. From the dashboard home, copy:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click the eye icon to reveal)
3. These two values are shared across all Sovamoon clients — do not create a new account

---

### Step 2 — Buy a Dedicated Phone Number for Capellán

Each client gets their own number so WhatsApp messages show the client's business name, not Sovamoon's.

1. In the Twilio Console, go to **Phone Numbers → Manage → Buy a number**
2. Search by country: **United States** (DR numbers use US country code +1)
3. Filter by capability: check **SMS** (WhatsApp runs over SMS infrastructure)
4. Pick a number with a DR-recognizable area code if possible (809, 829, or 849)
   - If unavailable, any US number works — customers see the business name, not the number
5. Click **Buy** (~$1.15/month) - (516) 979-3954
6. Note the purchased number — this becomes `TWILIO_WHATSAPP_FROM`

---

### Step 3 — Register the Number as a WhatsApp Business Sender

**Option A: Sandbox (testing only — use while waiting for Meta approval)**

1. In Twilio Console, go to **Messaging → Try it out → Send a WhatsApp message**
2. The sandbox number is `+14155238886` (Twilio's shared sandbox — not client-specific)
3. To receive test messages, the owner's phone must send `join <sandbox-keyword>` to that number via WhatsApp
4. Use this for development and demos only — real customers cannot receive sandbox messages

**Option B: WhatsApp Business API (required for production)**

1. In Twilio Console, go to **Messaging → Senders → WhatsApp senders**
2. Click **Add new sender** and select the number purchased in Step 2
3. You'll be walked through Meta Business verification. You'll need from the client:
   - Their **Facebook Business Manager account** (or create one at business.facebook.com)
   - The **business legal name** as it appears on registration
   - **Business display name** customers will see (e.g. "Capellán Auto Solution Express")
   - The **phone number** purchased in Step 2 — must not be registered on personal WhatsApp
4. Meta reviews the submission — approval takes **2–5 business days**
5. Once approved, the number is a live WhatsApp Business sender — any phone worldwide can receive messages from it

---

### Step 4 — Set Environment Variables

Add these to `.env.local` (local dev) and to Vercel (production):

```env
# Sovamoon's shared Twilio credentials — same across all clients
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# Capellán's dedicated WhatsApp sender — the number bought in Step 2
# Must include the whatsapp: prefix
TWILIO_WHATSAPP_FROM=whatsapp:+15169793954

# The shop owner's personal WhatsApp number — where new booking alerts are sent
# Dominican Republic: +1-809-XXX-XXXX / +1-829-XXX-XXXX / +1-849-XXX-XXXX
OWNER_WHATSAPP_NUMBER=+18094302268
```

> **Important:** `TWILIO_WHATSAPP_FROM` must include the `whatsapp:` prefix exactly as shown.
> `OWNER_WHATSAPP_NUMBER` must NOT include the prefix — it is added in code.
> These two numbers will likely be different — the FROM is Capellán's business sender; OWNER is the shop owner's personal phone.

---

### Step 5 — Customer Phone Number Format

For messages to reach Dominican Republic customers, their phone number must be in **E.164 format**:

| What customer types | What Twilio needs |
|---------------------|-------------------|
| `8091234567`        | `+18091234567`    |
| `809-123-4567`      | `+18091234567`    |
| `1-809-123-4567`    | `+18091234567`    |

The booking form currently accepts free-text input. Until phone validation is added (see roadmap below), coach the owner to ensure customers enter the full number including the area code.

---

### Step 6 — Test It

1. Start the app locally: `npm run dev`
2. Complete a booking with your own WhatsApp number as the customer phone
3. Check that:
   - Owner number receives the new appointment alert
   - Customer number receives the confirmation with reference number
4. If no message arrives, check the Twilio Console under **Monitor → Logs → Messaging** for error details

---

### Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `21408` — Permission to send an SMS has not been enabled | WhatsApp not enabled on account | Enable WhatsApp in Twilio Console |
| `21211` — Invalid To phone number | Number not in E.164 format | Ensure `+1` prefix for DR numbers |
| `63016` — Channel inactive | Sandbox only: recipient hasn't joined | Use Option B (Business API) for production |
| `21606` — From number not WhatsApp enabled | Wrong sender number | Confirm `TWILIO_WHATSAPP_FROM` is a WhatsApp-enabled number |
| No error but no message | Env vars not loaded | Restart dev server after editing `.env.local` |

---

## Supabase (Database)

When ready to go live, the app needs a Supabase project with these tables:

```sql
-- Services offered by the shop
create table services (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  duration_hours integer not null default 1,
  price numeric not null default 0,
  icon text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Weekly schedule (one row per day)
create table availability (
  id uuid default gen_random_uuid() primary key,
  day_of_week text unique not null, -- Mon, Tue, Wed, Thu, Fri, Sat, Sun
  is_open boolean default true,
  open_time text default '08:00',
  close_time text default '17:00'
);

-- Specific dates that are closed (holidays, vacations)
create table blocked_dates (
  date date primary key
);

-- Customer bookings
create table bookings (
  id uuid default gen_random_uuid() primary key,
  service_id text,
  service_name text,
  date date not null,
  time text not null,
  duration_hours integer default 1,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  car_make text,
  car_model text,
  car_year text,
  notes text,
  status text default 'pending', -- pending | confirmed | completed | no_show | cancelled
  created_at timestamptz default now()
);

-- App settings (key/value store)
create table settings (
  key text primary key,
  value text
);
```

Add the Supabase env vars to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Admin Access

The admin panel is at `/admin`. The default password is set via:

```env
ADMIN_PASSWORD=your_secure_password
```

Change this before going live.

---

## Deploy to Vercel (Production)

### Prerequisites
- GitHub account (free)
- Vercel account (free) — sign up at vercel.com with your GitHub account
- Supabase project created and tables migrated (see Supabase section above)
- Twilio WhatsApp sender approved (or sandbox for testing)

---

### Step 1 — Push the project to GitHub

The project is not yet a git repo. Run these commands once from the project root:

```bash
cd /Users/robertdeluna/Projects/clients/capellan-auto/capellan-booking

git init
git add .
git commit -m "Initial commit — Capellan Auto booking app"
```

Then create a new **private** repo on GitHub (github.com → New repository):
- Name: `capellan-booking`
- Visibility: **Private**
- Do NOT initialize with README (you already have code)

Then push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/capellan-booking.git
git branch -M main
git push -u origin main
```

> Use the `teamsovamoon` GitHub org if this is a Sovamoon-managed client repo.

---

### Step 2 — Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select the `capellan-booking` repo
4. Framework will be auto-detected as **Next.js** — leave all build settings as-is
5. Click **Deploy** — the first deploy will fail (no env vars yet) — that's OK

---

### Step 3 — Add Environment Variables

1. In Vercel, go to the project → **Settings → Environment Variables**
2. Add each variable below for **Production** (and optionally Preview):

```
NEXT_PUBLIC_SUPABASE_URL          https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     your_anon_key
SUPABASE_SERVICE_ROLE_KEY         your_service_role_key

TWILIO_ACCOUNT_SID                ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN                 your_auth_token
TWILIO_WHATSAPP_FROM              whatsapp:+1XXXXXXXXXX
OWNER_WHATSAPP_NUMBER             +1XXXXXXXXXX

ADMIN_PIN                         change_this_before_going_live
```

> **Never commit these values to GitHub.** Vercel injects them at build/runtime — your `.env.local` file is only for local dev and is gitignored.

---

### Step 4 — Redeploy

After adding env vars:

1. Go to **Deployments** tab in Vercel
2. Click the three-dot menu on the latest deployment → **Redeploy**
3. Wait ~60 seconds for the build to finish
4. Click the deployment URL (e.g. `capellan-booking.vercel.app`) to verify it's live

---

### Step 5 — Connect a Custom Domain

When the client has their domain (e.g. `reservas.capellanauto.com`):

1. In Vercel → **Settings → Domains**
2. Click **Add Domain** → enter the domain or subdomain
3. Vercel will show you a DNS record to add — either:
   - **CNAME** → `cname.vercel-dns.com` (for subdomains like `reservas.capellanauto.com`)
   - **A record** → `76.76.21.21` (for apex domains like `capellanauto.com`)
4. Add that record in the client's DNS provider (Cloudflare, GoDaddy, etc.)
5. Vercel auto-provisions an SSL certificate within a few minutes

---

### Step 6 — Verify Everything Works

Go through the full flow on the live URL:

- [ ] Home page loads with logo and service cards
- [ ] Select a service → booking sheet opens
- [ ] Pick a date — calendar shows correct availability
- [ ] Complete a booking — confirmation screen shows reference number
- [ ] Owner receives WhatsApp notification
- [ ] Customer receives WhatsApp confirmation
- [ ] `/admin` login works with the `ADMIN_PIN`
- [ ] Admin calendar shows the new booking
- [ ] Mark booking complete/cancelled → slot frees up

---

### Ongoing Deploys

Every time you push to `main` on GitHub, Vercel automatically rebuilds and redeploys — no manual steps needed.

```bash
git add .
git commit -m "your change description"
git push
```

Vercel deploys in ~60 seconds.

---

## Google Business Profile (GBP)

Google Business Profile is the free listing that makes Capellán appear on Google Maps and in local search results. For a Dominican Republic business, setup is the same as any Google business — just use the DR address.

> **Why this matters:** When someone in Santo Domingo searches "mecánico cerca de mí" or "cambio aceite Santo Domingo", GBP listings appear above organic results. It is the single highest-ROI local SEO action.

---

### Step 1 — Create or Claim the Listing

1. Go to [business.google.com](https://business.google.com) — sign in with a Google account owned by the business (or create one)
2. Click **Manage now** → **Add your business to Google**
3. Enter the business name: **Capellán Auto Solution Express**
4. Category: type **Auto Repair Shop** → select it as the primary category
   - Add secondary categories: **Oil Change Service**, **Brake Shop**, **Auto Air Conditioning Service**
5. If Google finds an existing unverified listing, click **Claim this business** — do not create a duplicate
6. Enter the **physical address** in Dominican Republic (street, sector, Santo Domingo, DO)
   - If the shop serves customers on-site: select **Storefront** (shows address publicly)
   - If the shop also does mobile service: can add a service area too

---

### Step 2 — Add Business Details

Fill in every field — Google rewards completeness with higher rankings:

| Field | What to Enter |
|-------|--------------|
| Phone | Primary DR number (809/829/849 area code) |
| Website | `https://www.capellanservicio.com` |
| Hours | Mon–Fri 8am–5pm, Sat 9am–2pm, Sun closed |
| Description | 750-char max. Write in Spanish. Include "Santo Domingo", "República Dominicana", "cambio aceite", "frenos", "A/C" naturally |
| Opening date | Actual founding date |
| Attributes | "Identifies as Hispanic-owned", "Spanish-speaking staff" |

---

### Step 3 — Verify the Business

Google requires verification to publish the listing. Options (DR will typically be offered):

- **Video verification** (most common now) — record a short video showing the exterior sign, interior, and equipment. Takes 1–5 business days for Google to review.
- **Postcard** — Google mails a code to the physical address. Takes 5–14 days to arrive in DR; use only if video is rejected.
- **Phone/email** — sometimes offered for businesses that already have some Google presence.

Once verified, the listing is live and editable.

---

### Step 4 — Add Photos

Upload photos immediately after verification — profiles with photos get 42% more direction requests:

- Exterior of the shop (street view, sign visible)
- Interior and work bays
- Team members working
- Before/after of services (oil change, brake job)
- Logo (`logo.png` from the booking site)

Minimum: **10 photos**. Add 1–2 new photos per month going forward.

---

### Step 5 — Add the Booking Link

1. In GBP dashboard → **Info → Appointment links**
2. Add: `https://www.capellanservicio.com`
3. This creates a "Book" button on the Maps listing that goes directly to the booking app

---

### Step 6 — Connect to Google Search Console

Search Console lets you monitor how capellanservicio.com ranks in Google search.

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Click **Add property** → enter `https://www.capellanservicio.com`
3. Verify ownership via **HTML tag method** (easier with Next.js):
   - Copy the meta tag Google gives you (looks like `<meta name="google-site-verification" content="xxxx" />`)
   - Add it to `app/layout.tsx` inside the `<head>` block
   - Deploy to Vercel → click **Verify** in Search Console
4. Once verified, submit the sitemap: `https://www.capellanservicio.com/sitemap.xml`
   - Next.js generates this automatically at that path when deployed

---

### Step 7 — Ongoing (Monthly)

- **Respond to every review** — especially negative ones (shows professionalism)
- **Post weekly** — GBP Posts (short updates, promotions, tips) keep the profile active
- **Update holiday hours** — prevents bad reviews from customers showing up when closed
- **Add new photos monthly** — fresh photos signal an active business

---

## Instagram Auto-Posting (via Sovamoon)

Capellán's Instagram page will be managed by Sovamoon's social automation pipeline. The shop owner does not need to write or schedule posts — Sovamoon generates and posts automatically.

---

### What Sovamoon Posts for Capellán

Content is AI-generated in Spanish, targeted at DR car owners:

| Type | Frequency | Example |
|------|-----------|---------|
| Car maintenance tips | 3×/week | "¿Cuándo fue la última vez que revisaste el aceite? Cambia tu aceite cada 5,000 km para proteger tu motor." |
| Service promotions | 1×/week | "Inspección gratuita con cualquier cambio de aceite este mes." |
| Educational content | 2×/week | "Los frenos hacen ruido? Puede ser señal de que las pastillas están desgastadas. ¡No lo ignores!" |
| Before/after photos | As available | Owner sends shop photos via WhatsApp → Sovamoon posts with caption |

---

### Step 1 — Create the Instagram Business Account

1. Create a **personal Instagram account** at instagram.com (or use an existing one)
2. Go to **Settings → Account → Switch to Professional Account**
3. Select **Business** → Category: **Automotive Service**
4. Connect it to a **Facebook Page** for Capellán (required by Meta for API access)
   - Create the Facebook Page at facebook.com/pages/create if one doesn't exist
   - Category: **Automotive Service**
   - Name: **Capellán Auto Solution Express**

> **Important:** The Instagram account and Facebook Page must be connected BEFORE Sovamoon can post. Meta requires this for the Graph API.

---

### Step 2 — Connect to Sovamoon's Social Automation

This is handled by the Sovamoon team (not by Capellán):

1. Sovamoon adds Capellán's Facebook Page to the **Sovamoon Meta Business Manager** account
2. In Meta Business Manager → **Accounts → Instagram accounts** → add Capellán's Instagram
3. Assign Sovamoon's Meta App as a **"manager"** of both the Page and Instagram account
4. Sovamoon configures the client's content profile:
   - Language: Spanish (es-DO)
   - Brand voice: Professional, trustworthy, local
   - Posting schedule: Mon/Wed/Fri tips + Tue promotional
   - Hashtags: `#Mecánico #SantoDomingo #RepúblicaDominicana #CapellánAuto #CambioAceite #MantenimientoVehicular`

---

### Step 3 — Owner Sends Raw Content (Optional)

Sovamoon generates posts automatically, but the owner can send raw materials to enhance posts:

- **Shop photos/videos** → WhatsApp to Sovamoon → posted with AI-generated caption
- **Promotions** → "20% off frenos este viernes" → Sovamoon posts with graphic
- **Customer permission quotes** → short customer testimonials → posted as quote cards

---

### Step 4 — Review & Approval Workflow

Two modes (configured per client):

- **Auto-post** — posts go live on schedule without owner review (recommended for tips/educational content)
- **Approval required** — owner receives a WhatsApp preview 24h before each post; approves with ✅ or rejects with ❌

For Capellán: **Auto-post for tips, approval required for promotions**.

---

### Step 5 — Reporting

Sovamoon sends a monthly Instagram performance report to the owner:

- Reach and impressions per post
- Follower growth
- Top performing content
- Engagement rate (likes + comments / reach)

---

### Client Action Items (Before Sovamoon Can Post)

- [ ] Create Instagram Business account and connect to a Facebook Page
- [ ] Share Instagram username and Facebook Page URL with Sovamoon
- [ ] Accept the Meta Business Manager connection request (Sovamoon will send it)
- [ ] Confirm posting schedule preference: auto-post vs. approval workflow
- [ ] Send 5–10 shop photos via WhatsApp to seed the first week of content

---

## What's Next (Roadmap)

Ordered by business impact:

### High Priority

1. **Appointment status flow**
   Admin can move a booking through: `pending → confirmed → completed` or mark as `no_show` or `cancelled`. Currently all bookings sit at "pending" forever. This is the most important missing operational feature.

2. **Phone number validation (DR format)**
   Auto-format customer phone to E.164 (`+1-809/829/849-XXX-XXXX`) before saving and before sending WhatsApp. Without this, customer confirmation messages silently fail if the number is entered in local format.

3. **Cancel/reschedule (customer self-service)**
   Customer gets a secure link with their reference number to cancel or request a reschedule. Reduces owner phone interruptions for simple requests.

### Medium Priority

4. **Admin calendar view**
   Week-view grid showing all appointments visually by time slot. The current list view works but a calendar makes scheduling gaps and double-bookings obvious at a glance.

5. **Duplicate booking prevention**
   Detect when the same customer (by phone) attempts to book the same date/time twice and show a friendly error.

6. **Reminder notifications**
   Automatically send a WhatsApp reminder to the customer 24 hours before their appointment. Requires a cron job or Vercel scheduled function.

### Nice to Have

7. **PWA (installable on phone)**
   Add a `manifest.json` and service worker so customers can add the booking page to their home screen. Critical in DR where mobile usage dominates.

8. **Post-service review prompt**
   When admin marks a booking as "completed", automatically send a WhatsApp asking the customer to leave a Google Maps review.

9. **Revenue reporting**
   Dashboard charts: bookings per week, revenue by service, peak hours, no-show rate.
