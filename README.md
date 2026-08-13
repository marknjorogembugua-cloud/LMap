# LinkMeApp

The digital operating system for Kenya's informal economy — worker profiles (LinkedIn), gig matching (Uber), and instant M-Pesa payments, in one mobile-first PWA.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind) — full-stack, PWA-installable
- **Supabase Postgres + Prisma 7** (driver adapter: `@prisma/adapter-pg`)
- **Auth**: phone-number OTP, JWT session cookie (`jose`)
- **Payments**: Safaricom Daraja API (M-Pesa STK Push)

## Modules

| Module | Where |
|---|---|
| Auth (OTP) | `src/app/login`, `src/app/api/auth/*`, `src/lib/otp.ts`, `src/lib/session.ts` |
| Worker profiles | `src/app/onboarding/worker`, `src/app/workers`, `src/app/api/profile`, `src/app/api/workers` |
| Gig marketplace | `src/app/gigs`, `src/app/api/gigs` |
| Bookings | `src/app/bookings`, `src/app/api/bookings` |
| Payments (M-Pesa) | `src/app/api/payments/mpesa`, `src/lib/mpesa.ts` |
| Reviews/trust | `src/app/api/reviews` |

## First-time setup

1. **Install dependencies** (already done if you're reading this after the initial scaffold):
   ```bash
   npm install
   ```

2. **Database**: hosted on Supabase (project ref `ueqqjyomdnlhkuuwwqvz`). `DATABASE_URL` in `.env` points at the **session-mode connection pooler** (`aws-1-eu-west-1.pooler.supabase.com:5432`) rather than the direct host (`db.<ref>.supabase.co:5432`) — the direct host only resolves over IPv6, which many networks (including this dev box) don't have outbound access to. The pooler's session mode behaves like a normal direct connection (supports the advisory locks/DDL that `prisma migrate` needs), unlike transaction mode (port 6543), which is better saved for high-concurrency runtime traffic later.

3. **Run the first migration** (already done once against the live Supabase DB — re-run if the schema changes):
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Start the dev server**:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Environment variables (`.env`)

Already scaffolded with working local-dev defaults. Notable ones:

- `DATABASE_URL` — points at the local `linkmeapp` Postgres role/db created above.
- `SMS_PROVIDER=console` — in dev, OTP codes are printed to the server terminal instead of sent by SMS. Watch the terminal running `npm run dev` when logging in. Switch to `africastalking` + fill `AFRICASTALKING_*` for real SMS delivery.
- `MPESA_*` — Safaricom Daraja **sandbox** credentials. Sign up free at https://developer.safaricom.co.ke, create an app, and fill in `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` / `MPESA_PASSKEY`. The default `MPESA_SHORTCODE=174379` is Safaricom's shared sandbox till.
- `MPESA_CALLBACK_URL` — Safaricom needs a **publicly reachable** URL to POST payment results to. For local dev, run `ngrok http 3000` and set this to `https://<your-ngrok-subdomain>.ngrok.io/api/payments/mpesa/callback`.

## How the core flow works

1. A client posts a gig (or browses workers and sends a direct request) — `Gig`.
2. A worker applies (or is directly invited) — creates a `Booking` in `REQUESTED` status.
3. Client accepts → `ACCEPTED` (other applicants on the same gig are auto-declined).
4. Worker starts the job → `IN_PROGRESS`.
5. Client marks it done → `COMPLETED`.
6. Client pays via M-Pesa STK Push — a `Transaction` is created `PENDING`, then flipped to `SUCCESS`/`FAILED` by Safaricom's callback.
7. Both sides can leave a `Review`; a worker's `WorkerProfile.ratingAvg` is recomputed automatically.

## Not yet built (post-MVP)

- Photo/document upload for profile verification (worker `verified` flag currently manual)
- Push notifications (currently in-app / SMS only)
- B2C payout automation to workers (MVP flow has the client pay the platform till directly; worker payout/settlement is a phase-2 concern once a real Paybill/Till is provisioned)
- Admin/moderation tooling
