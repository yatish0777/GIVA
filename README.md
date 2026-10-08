# GIVA — GST Invoice Management Website

**Ek App. Pura Invoice Process.**
A PBL project website that explains (with animations) and demonstrates (with a live database) how a business can **receive, verify, dispute, approve and track B2B GST invoices** in one place — instead of switching between WhatsApp, the GST portal, Tally, Excel and the bank.

## What's on the website

| Section | What it shows |
|---|---|
| Hero | Animated: scattered tools (WhatsApp, GST portal, Tally…) merge into one app |
| Problem | ABC Pipes ₹1 lakh example — the 7 separate steps a buyer does today |
| How it works | Step 1 invoice import & reading · Step 2 GST match (click Match / Mismatch / Missing) · Step 3 100 vs 90 pipes dispute · Step 4 dashboard |
| **Live MVP** | "Open as Buyer" / "Open as Seller" open the full MVP in a **new tab** (`/app?role=buyer` or `/app?role=seller`) + a 2-phone quick demo on the page. Every action is saved in Supabase and updates in real time |
| Main idea & USP | "Ask to change" instead of rejecting the whole invoice |
| Built for Bharat | WhatsApp-first, UPI, MSME 45-day tracker, local languages… |
| Contact | Feedback form saved to Supabase |

### Live demo flow (try it in two browser tabs)
1. **Start fresh demo** → ABC Pipes sends INV-xxx (100 PVC pipes × ₹1,000 + 18% GST = ₹1,18,000)
2. Buyer **opens the bill** → sees GST portal check (match / mismatch / missing)
3. Buyer taps **Ask to change → Quantity mismatch → 90 received**
4. Seller instantly sees "⚠️ 10 pipes missing" → **Approve** → credit note CN-xxx (₹11,800) is created automatically
5. Buyer **Accepts** → action "synced to GST IMS" → seller marks **payment received** (₹1,06,200)
6. Extra: dashboard rows INV-102 (amount mismatch) and INV-105 (not uploaded on GST), and **Ask for bill** when goods came without a bill

> GST portal actions are **simulated** — a real connection needs a registered GST Suvidha Provider (GSP).

## Languages
The whole website and MVP are available in **English, हिंदी and मराठी** (switcher in the top bar). The choice is remembered and shared across open tabs; `?lang=hi` / `?lang=mr` in the URL also works. Status-history events coming from the database are translated too. Translations live in `src/i18n/` (`en.js`, `hi.js`, `mr.js`).

## MVP features (`/app`, opens in a new tab)
| Problem-statement service | In the MVP |
|---|---|
| B2B invoice auto-sent to buyer, who can accept / reject / **modify** | Seller → *New invoice* (PVC items, GST, CGST/SGST or IGST) → appears instantly in buyer inbox. Buyer: Accept, Pending, Reject (reason), **Modify** (quantity / damaged / rate / GST issue) |
| Lodge accept/reject with GST system | Every action is logged as "synced to GST IMS" (simulated); GST check shows Match / Amount mismatch / Not on GST |
| Buyer can seek invoice not uploaded by seller | **Ask for bill** (buyer) → **Bill requests** (seller) → *Create bill* pre-filled & linked |
| Inventory, credit / debit notes | Stock auto: seller stock-out on invoice, buyer stock-in on accept (minus short/damaged). Credit note auto on approved correction; seller can issue manual credit/debit notes |
| Generate the return | Seller **GSTR-1** (B2B + CDNR) and buyer **GSTR-2B / 3B ITC** summary per month, download CSV / JSON |
| Real-time status tracking | Live dashboard, filters, status chips, per-invoice timeline, toast alerts for the other party's actions |

## Tech stack
- **Frontend:** React 18 + Vite + Tailwind CSS v4 + Framer Motion (animations) + lucide icons
- **Backend:** Supabase (PostgreSQL, Row Level Security, Realtime, RPC functions)
- **Hosting:** Vercel (auto-deploys from this repo)

## Database (Supabase)
Tables: `businesses`, `invoices`, `invoice_items`, `disputes`, `credit_notes`, `invoice_requests`, `status_history`, `feedback`

Every write goes through a validated Postgres function (the browser cannot insert/update tables directly):

| Function | Who | Does |
|---|---|---|
| `create_invoice` | Seller | Creates invoice + items, reports it on GST (simulated) |
| `mark_viewed` | Buyer | Marks bill as opened |
| `buyer_action` | Buyer | Accept / Reject / Pending (mirrors GST IMS) |
| `raise_dispute` | Buyer | "Ask to change" — quantity, damaged, rate or GST issue |
| `resolve_dispute` | Seller | Approve (auto credit note) or reject |
| `upload_to_gst` | Seller | Upload / amend invoice on GST portal (simulated GSTR-1 / 1A) |
| `request_invoice` / `decline_request` | Buyer / Seller | "Ask for bill" flow |
| `mark_paid` | Seller | Payment received |
| `submit_feedback` | Anyone | Contact form (feedback table is private — no public read) |

## Run locally
```bash
npm install
cp .env.example .env   # add your Supabase URL + publishable key
npm run dev
```

## Notes
- This is a public demo: anyone can read the sample invoices and use the demo buttons. Feedback entries are private.
- Demo businesses and GSTINs are fictional.
