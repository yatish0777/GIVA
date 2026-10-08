# GIVA — GST Invoice Management Website

**Ek App. Pura Invoice Process.**
A PBL project website that explains (with animations) and demonstrates (with a live database) how a business can **receive, verify, dispute, approve and track B2B GST invoices** in one place — instead of switching between WhatsApp, the GST portal, Tally, Excel and the bank.

## What's on the website

| Section | What it shows |
|---|---|
| Hero | Animated: scattered tools (WhatsApp, GST portal, Tally…) merge into one app |
| Problem | ABC Pipes ₹1 lakh example — the 7 separate steps a buyer does today |
| How it works | Step 1 invoice import & reading · Step 2 GST match (click Match / Mismatch / Missing) · Step 3 100 vs 90 pipes dispute · Step 4 dashboard |
| **Live demo** | Two phones side by side — **Buyer** (Shree Sai Hardware) and **Seller** (ABC Pipes). Every action is saved in Supabase and updates both phones in real time |
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
