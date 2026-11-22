# Account setup: the 3 sign-ups only you can do

**Pinterest:** https://www.pinterest.com/launchpointedu/

**TikTok:** https://www.tiktok.com/@launchpointedu

**Live store:** https://www.teacherspayteachers.com/store/launchpoint-education

These three accounts legally belong to a real person or business. Each one asks for your identity, phone verification, and (for TpT and Stripe) your tax ID and bank details, and each makes you personally accept their terms. Claude can't create them for you: it has no way to sign up as you, and shouldn't hold your banking or tax details. Everything after sign-up, Claude does.

Total time: about **35 minutes**. Every answer is filled in below, so you only copy.

---

## 1. Teachers Pay Teachers (≈15 min, then about 5 min per listing). Brings the first money soonest.
1. Go to **teacherspayteachers.com** › **Sell on TpT** › sign up. Use **hello@launchpointeducation.com**.
2. Choose the **Basic** seller plan: a **one-time $29 fee** (not yearly). You keep 55% of each sale minus $0.30. Skip the $59.95/yr **Exclusive** plan for now: it requires selling our resources only on TpT, which conflicts with offering free versions on our own site.
3. **Store name:** LaunchPoint Education
4. **Store bio:** *A teacher-founded shop. Print-and-go K–8 math practice with answer keys, plus free lesson plans, slides and worksheets at launchpointeducation.com.*
5. **Payout:** PayPal or bank. **Tax info:** your SSN or an EIN (an EIN is free from irs.gov in 10 minutes and keeps your SSN private).
6. Upload the packs using `marketing/tpt/LISTINGS.md`, which has the title, description, tags and price for each. List **pack 06 as free** first, then the two **winter packs (07, 08) right away**, since winter-break sales stop around December 15.
7. **Tell Claude the store URL.** It goes into the site footer, every future pack, and the TikTok and Pinterest bios.

*Maryam as the store's face:* TpT buyers trust teacher-run stores. Consider "Created by Maryam, K–8 teacher" in the bio.

## 2. Stripe (≈15 min). Turns on paid plans (Pro at $9/mo or $59/yr).
1. Go to **stripe.com** › **Start now**. Use hello@launchpointeducation.com.
2. **Business type:** Individual / sole proprietor (switch to LLC later if you form one).
3. **Industry:** Software › *Educational software* (or "Digital products").
4. **Website:** https://launchpointeducation.com
5. **Product description:** *Subscription software for K–8 teachers that generates editable lesson plans, slides and worksheets.*
6. **Statement descriptor** (what shows on card statements): `LAUNCHPOINT EDU`
7. Add your bank account for payouts.
8. **Then give Claude access safely:**
   - Stripe dashboard › Developers › API keys › **Create restricted key** with write access to *Products, Prices, Checkout Sessions, Customers, Customer portal, Webhooks*.
   - Tell Claude "Stripe is ready". Claude will open a **secure form** where you paste the key; it's never typed into chat.
   - Claude then builds the products, checkout, sign-in and the Pro features. Nothing charges anyone until you approve going live.

## 3. TikTok (≈5 min). Also use the same videos for Instagram Reels and YouTube Shorts.
1. Install TikTok › sign up with hello@launchpointeducation.com.
2. Profile › ☰ › Settings › Account › **Switch to Business Account** › category *Education*.
3. **Username:** `@launchpointedu` (fallbacks: `@launchpoint.education`, `@launchpointteach`)
4. **Name:** LaunchPoint Education
5. **Bio:** *Teacher-made ✏️ Free K–8 lesson plans & worksheets in minutes 👇*
6. **Link:** launchpointeducation.com
7. Post the 3 videos from `marketing/tiktok/` using `POSTING-GUIDE.md`: one every 2–3 days, at 6–8pm on weeknights or Sunday afternoon (planning time).
8. When posting, turn on **"AI-generated content"** under More options, since the voiceover is a generated voice. TikTok requires the label, and teachers respect the honesty.

Videos stay fully automated: screen recordings with a generated voiceover and captions, with no one on camera. New ones arrive every Monday, ready to post.

---

## After each one is done, tell Claude:
- **TpT:** the store URL → Claude adds it everywhere and makes 2 new packs a week.
- **Stripe:** "Stripe is ready" → Claude asks for the key securely and builds checkout.
- **TikTok:** the handle → Claude puts it on the site and plans the posting calendar.
- **Pinterest:** see `marketing/pinterest/PINS.md` (≈10 min). Paste the claim tag to Claude.
