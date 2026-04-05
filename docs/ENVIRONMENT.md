# Environment Variables

A reference for every environment variable used by RPM Manager.

---

## Required — Core

These must be set for the app to start.

| Variable | Where to get it | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API | `https://abcdef.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API | `eyJhbGci...` |
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string → **Transaction** pooler | `postgresql://postgres.xxx:pass@aws-...pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Supabase → Project Settings → Database → Connection string → **Session** pooler (port 5432) | `postgresql://postgres.xxx:pass@aws-...pooler.supabase.com:5432/postgres` |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL | `https://rpm.example.com` or `http://localhost:3000` |

> `DATABASE_URL` uses the **transaction** pooler (port 6543) for Prisma query engine.
> `DIRECT_URL` uses the **session** pooler (port 5432) for `prisma migrate`.

---

## Required — Cron Security

| Variable | How to generate | Notes |
|---|---|---|
| `CRON_SECRET` | `openssl rand -hex 32` | Sent as `Authorization: Bearer <secret>` by Vercel Cron. Prevents public access to cron endpoints. |

---

## Optional — Email (Resend)

Without this, emails silently fail (no crash). The app logs a warning.

| Variable | Where to get it |
|---|---|
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |

Emails sent: estimates, invoices, inspection reports, appointment reminders, service reminders, after-service thank-you.

---

## Optional — SMS (Twilio)

Without this, SMS features are hidden or silently fail.

| Variable | Where to get it |
|---|---|
| `TWILIO_ACCOUNT_SID` | [twilio.com](https://console.twilio.com) → Account Info |
| `TWILIO_AUTH_TOKEN` | [twilio.com](https://console.twilio.com) → Account Info |
| `TWILIO_PHONE_NUMBER` | Twilio Console → Phone Numbers (e.g. `+15558675309`) |

SMS sent: appointment reminders (manual trigger), service reminders (automated cron).

---

## Optional — Payments (Stripe Connect)

Without this, the Billing settings page shows a disabled state and customers cannot pay online.

| Variable | Where to get it |
|---|---|
| `STRIPE_SECRET_KEY` | [stripe.com](https://dashboard.stripe.com) → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → your endpoint → Signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys |
| `STRIPE_CONNECT_CLIENT_ID` | Stripe → Connect → Settings → Client ID (starts with `ca_`) |

The webhook endpoint is at `/api/webhooks/stripe`. Register it in the Stripe dashboard pointing to `https://your-domain.com/api/webhooks/stripe`. Required events: `payment_intent.succeeded`, `account.updated`.

---

## Local Development Notes

Create `.env.local` for local overrides (gitignored). The `.env` file at the root can hold non-secret defaults.

For local Supabase, you can run `supabase start` (requires [Supabase CLI](https://supabase.com/docs/guides/local-development)) and use the local URLs and keys it prints.

For Stripe webhooks locally, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
The CLI will print a webhook signing secret to use as `STRIPE_WEBHOOK_SECRET`.
