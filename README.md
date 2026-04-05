# RPM Manager

A multi-tenant SaaS application for independent auto repair shops. Manages the full repair order lifecycle: customer intake, estimates, work orders, digital inspections, parts inventory, invoicing, and payments.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Database | PostgreSQL via Supabase |
| ORM | Prisma v7 |
| Auth | Supabase Auth (email/password, JWT) |
| Storage | Supabase Storage |
| Email | Resend |
| SMS | Twilio |
| Payments | Stripe Connect |
| Hosting | Vercel |
| Package manager | pnpm |

---

## Prerequisites

- Node.js 22+
- pnpm
- A [Supabase](https://supabase.com) project (free tier works)
- (Optional) Stripe, Resend, and Twilio accounts for payments/email/SMS

---

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables to get running locally:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See `.env.example` for the full list including Stripe, Resend, Twilio, and the cron secret.

### 3. Run database migrations

```bash
pnpm db:migrate
```

### 4. (Optional) Seed demo data

```bash
pnpm db:seed
```

This creates a demo shop with sample customers, vehicles, estimates, and work orders.

### 5. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up for an account — the first user becomes the shop Owner.

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript type check |
| `pnpm format` | Prettier format |
| `pnpm test:unit` | Run unit tests (Vitest) |
| `pnpm test:unit:watch` | Unit tests in watch mode |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:generate` | Regenerate Prisma client |

---

## Project Structure

```
rpm-manager/
├── prisma/
│   ├── schema.prisma          # Full database schema
│   ├── migrations/            # Migration history
│   └── seed.ts                # Demo data
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, signup, forgot password
│   │   ├── (dashboard)/       # Main app (sidebar layout)
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── customers/     # Customer list, detail, new, edit, import
│   │   │   ├── vehicles/      # Vehicle list, detail, new, edit
│   │   │   ├── estimates/     # Estimate list, detail, new, edit
│   │   │   ├── work-orders/   # Work order list/kanban, detail, new, edit
│   │   │   ├── inspections/   # Inspection list, detail
│   │   │   ├── appointments/  # Day/week calendar view, new, edit
│   │   │   ├── inventory/     # Parts list, detail, new
│   │   │   ├── invoices/      # Invoice list, detail, new
│   │   │   ├── reports/       # Revenue, ARO, AR aging charts
│   │   │   └── settings/      # Shop profile, team, billing, canned jobs
│   │   ├── (print)/           # Print-only layout (no sidebar)
│   │   │   ├── estimates/     # Printable estimate
│   │   │   ├── invoices/      # Printable invoice
│   │   │   ├── work-orders/   # Printable repair order
│   │   │   └── customers/     # Customer account statement
│   │   ├── api/
│   │   │   ├── search/        # Global search endpoint
│   │   │   ├── inventory/     # Inventory search (for line item editor)
│   │   │   ├── vin/           # NHTSA VIN decoder
│   │   │   ├── cron/          # Scheduled jobs
│   │   │   └── webhooks/      # Stripe webhook handler
│   │   └── customer-portal/   # Public token-based pages (no login required)
│   ├── modules/               # Business logic by domain
│   │   ├── auth/
│   │   ├── customers/
│   │   ├── vehicles/
│   │   ├── estimates/
│   │   ├── work-orders/
│   │   ├── inspections/
│   │   ├── appointments/
│   │   ├── inventory/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── service-reminders/
│   │   ├── canned-jobs/
│   │   ├── dashboard/
│   │   ├── reports/
│   │   └── settings/
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives
│   │   ├── layout/            # Sidebar, header, command palette
│   │   ├── forms/             # Customer form, vehicle form
│   │   ├── estimates/         # Line item editor, customer/vehicle selector
│   │   ├── invoices/          # Record payment form, Stripe pay button
│   │   ├── work-orders/       # Status transition, quick note
│   │   ├── appointments/      # Customer picker
│   │   ├── service-reminders/ # Reminders panel
│   │   └── canned-jobs/       # Canned job form
│   └── lib/
│       ├── db.ts              # Prisma client singleton
│       ├── supabase/          # SSR Supabase client helpers
│       ├── auth/              # Session helpers, RBAC permissions
│       ├── integrations/      # Stripe, Resend, Twilio, storage adapters
│       └── utils/             # Format helpers, constants
└── tests/
    ├── unit/                  # Vitest unit tests
    └── e2e/                   # Playwright E2E tests
```

---

## Multi-Tenancy

Every database table has a `tenantId` column. Isolation is enforced at two layers:

1. **Application layer** — `requireAuth()` returns the current `tenantId`, which is injected into every Prisma query.
2. **Database layer** — PostgreSQL Row-Level Security policies enforce `tenant_id` matching the JWT claim.

---

## Authentication & Roles

Authentication uses Supabase Auth with email/password. The JWT carries `tenant_id` and `role` as custom claims, stored in an HTTP-only cookie.

| Role | Capabilities |
|---|---|
| **Owner** | Full access including billing and user management |
| **Manager** | Full operational access, no billing |
| **Service Writer** | Customers, vehicles, estimates, work orders, invoices, appointments |
| **Technician** | Read customers/vehicles, update work orders and inspections |

Permissions are defined in `src/lib/auth/permissions.ts` and enforced in every server action via `requirePermission(role, "resource:action")`.

---

## Key Workflows

### Full Repair Order Lifecycle
1. **Customer & Vehicle** — create or look up customer, add vehicle (VIN decoder auto-fills year/make/model)
2. **Estimate** — add line items (labor, parts, fees, discounts), send to customer via email with a portal link
3. **Customer Portal** — customer views and approves/declines the estimate from any device
4. **Work Order** — convert approved estimate to a work order, assign technician, track status
5. **Inspection** — technician completes a digital vehicle inspection; send red/yellow/green report to customer
6. **Invoice** — generate invoice from completed work order, record payments (cash/check/card)
7. **Stripe** — customers can pay invoices online via Stripe Connect (each shop uses their own Stripe account)

### Work Order Status Flow
```
PENDING → CHECKED_IN → IN_PROGRESS → WAITING_PARTS
                                    → WAITING_APPROVAL
                                    → QUALITY_CHECK → COMPLETED → READY_FOR_PICKUP → DELIVERED
```
Any status can transition to `CANCELLED`. Each transition is logged in `WorkOrderStatusHistory`.

---

## Integrations

### Email (Resend)
Set `RESEND_API_KEY`. Sent for: estimates, invoices, inspection reports, appointment reminders, service reminders, after-service thank-you.

### SMS (Twilio)
Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`. Sent for: appointment reminders (manual trigger), service reminders (automated).

### Payments (Stripe Connect)
Set Stripe keys. Each shop connects their own Stripe account via OAuth in **Settings → Billing**. Customers pay invoices via the customer portal.

### VIN Decoder
Uses the free NHTSA API — no key required. Results are cached 24 hours.

---

## Scheduled Jobs (Cron)

Configured in `vercel.json`, running daily via Vercel Cron:

| Job | Schedule | What it does |
|---|---|---|
| `mark-overdue` | 9:00 AM UTC | Marks unpaid past-due invoices as OVERDUE |
| `expire-estimates` | 9:00 AM UTC | Marks sent estimates as EXPIRED after 30 days |
| `appointment-reminders` | 8:00 AM UTC | Sends SMS reminders for today's appointments |
| `service-reminders` | 10:00 AM UTC | Sends email reminders for service due in ≤7 days |

All cron routes require a `CRON_SECRET` header. Generate one with:
```bash
openssl rand -hex 32
```

---

## Deployment

The app is designed to deploy on Vercel with a Supabase PostgreSQL database.

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Vercel runs `prisma migrate deploy` automatically during build (configured in `prisma.config.ts`)
5. Cron jobs activate automatically from `vercel.json`

---

## Testing

**Unit tests** (Vitest) cover calculation utilities, schemas, workflow logic, and RBAC:
```bash
pnpm test:unit
```

**E2E tests** (Playwright) cover the full auth flow and critical user paths:
```bash
pnpm test:e2e
```

CI runs lint, typecheck, and unit tests on every push and pull request (`.github/workflows/ci.yml`).

---

## Customer Portal

Estimates, invoices, and inspection reports have shareable token-based links at:

- `/customer-portal/estimates/[token]` — view and approve/decline estimate
- `/customer-portal/invoices/[token]` — view invoice and pay online via Stripe
- `/customer-portal/inspection/[token]` — view DVI report with condition indicators

No login required — access is controlled by the unique token in the URL.
