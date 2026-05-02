# Capellan Auto — To-Do List

Status: ✅ Done · 🔄 In Progress · ⬜ Pending

---

## Critical (App broken without these)

- ✅ Phone number auto-format (DR 809/829/849 → E.164 +1XXXXXXXXXX)
- ✅ Local slot blocking — mock bookings now block slots during dev session
- ✅ Admin login mobile-friendly with real logo

---

## High Priority (Daily operations)

- ⬜ Booking confirmation email — send to customer email when provided
- ⬜ 24hr reminder notification — WhatsApp reminder before appointment (Vercel cron)
- ⬜ Duplicate booking prevention — block same customer booking same slot twice

---

## Medium Priority (Better experience)

- ⬜ Customer cancel/reschedule self-service — `/booking/[ref]` page, enter phone + reference to cancel
- ⬜ Admin StatsBar — fix to show today's count, week revenue, pending count (currently likely zeros)
- ⬜ Booking sheet loading state — show skeleton while availability/slots fetch on open
- ⬜ Customer form validation — reject malformed phone, require name minimum length

---

## Nice to Have (Growth)

- ⬜ PWA (installable) — manifest.json + app icons so customers can add to home screen
- ⬜ Post-service Google review prompt — WhatsApp sent when booking marked "completed"
- ⬜ Revenue dashboard — bookings/week, revenue/month, top service, busiest hour chart
- ⬜ Customer history — show admin repeat visit count + last service on booking detail

---

## Google Business Profile

- ⬜ Create/claim listing at business.google.com — category "Auto Repair Shop"
- ⬜ Fill all fields: DR address, hours, website (capellanservicio.com), phone, description in Spanish
- ⬜ Complete video verification (record exterior sign + interior + equipment)
- ⬜ Upload 10+ photos (exterior, interior, work bays, logo)
- ⬜ Add booking link → `https://www.capellanservicio.com`
- ⬜ Connect Google Search Console — add site-verification meta tag to layout.tsx, submit sitemap

---

## Instagram / Social Automation (via Sovamoon)

- ⬜ Create Instagram Business account — connect to Facebook Page for Capellán
- ⬜ Share Instagram username + Facebook Page URL with Sovamoon
- ⬜ Accept Meta Business Manager connection request from Sovamoon
- ⬜ Confirm auto-post vs. approval workflow preference
- ⬜ Send 5–10 shop photos to Sovamoon to seed first week of content

---

## Infrastructure

- ⬜ Push to GitHub (private repo under teamsovamoon)
- ⬜ Deploy to Vercel
- ⬜ Connect Supabase (run SQL migrations)
- ⬜ Configure Twilio WhatsApp sender (Meta Business approval)
- ⬜ Connect client domain via Cloudflare
