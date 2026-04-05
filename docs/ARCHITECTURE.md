# Architecture

A technical reference for how RPM Manager is structured and why.

---

## Overview

RPM Manager is a **multi-tenant SaaS monolith** built on Next.js 15 App Router. There is no separate API server — data fetching happens in Server Components via Prisma, and mutations go through Server Actions. External services (Stripe, Resend, Twilio) are accessed through adapter interfaces so they can be swapped without touching business logic.

```
Browser
  │
  ▼  HTTPS
Vercel Edge Network
  │
  ▼
Next.js 15 (App Router)
  ├── Server Components  → Prisma → Supabase PostgreSQL
  ├── Server Actions     → Prisma → Supabase PostgreSQL
  ├── API Routes         → webhooks, cron, search, VIN
  └── Middleware         → Supabase Auth JWT validation
        │
        ├── Resend        (transactional email)
        ├── Twilio        (SMS)
        ├── Stripe Connect (payments)
        └── NHTSA API     (VIN decode)
```

---

## Multi-Tenancy

Every table has a `tenantId` column. Isolation is enforced at two independent layers:

**Application layer** — `requireAuth()` extracts `tenantId` from the JWT and returns it. Every Server Action and Server Component query includes `{ tenantId }` in the Prisma `where` clause. This is non-optional — auth fails loudly if the session is missing.

**Database layer** — PostgreSQL Row-Level Security (RLS) policies on Supabase enforce that queries can only touch rows whose `tenant_id` matches the `tenant_id` claim in the JWT. This is a backstop — even if application code had a bug, the DB would reject cross-tenant reads.

---

## Authentication

Supabase Auth handles signup, login, and token refresh. The session is stored as an HTTP-only cookie managed by `@supabase/ssr`. On every request, Next.js middleware validates the JWT and refreshes it if needed.

The JWT carries two custom claims:
- `tenant_id` — the shop this user belongs to
- `role` — one of `OWNER`, `MANAGER`, `SERVICE_WRITER`, `TECHNICIAN`

`requireAuth()` in `src/lib/auth/session.ts` reads the session, looks up the user in the DB (for firstName, lastName, etc.), and returns a typed `SessionUser`. It redirects to `/login` if unauthenticated.

`getSession()` does the same but returns `null` instead of redirecting — used in middleware and conditional UI.

---

## Role-Based Access Control

Permissions are a flat map in `src/lib/auth/permissions.ts`:

```ts
"estimates:send": ["OWNER", "MANAGER", "SERVICE_WRITER"]
"work-orders:status": ["OWNER", "MANAGER", "SERVICE_WRITER", "TECHNICIAN"]
```

Every Server Action calls `requirePermission(role, "resource:action")` which throws if the role lacks the permission. UI conditionally shows/hides buttons based on the same check, but the server is always authoritative.

---

## Data Access Pattern

**Reads** — Server Components call query functions in `src/modules/[domain]/queries.ts`. These call Prisma directly with `tenantId` injected. Server Components never call Server Actions.

**Writes** — Forms submit to Server Actions in `src/modules/[domain]/actions.ts`. Actions:
1. Call `requireAuth()` to get `tenantId` and `role`
2. Call `requirePermission()` to enforce RBAC
3. Parse and validate input with Zod
4. Run the Prisma mutation
5. Call `revalidatePath()` to bust the cache
6. Redirect or return an error object

Server Actions provide built-in CSRF protection. There are no `fetch` calls to internal API routes for mutations — only for the search endpoint, inventory search, and VIN decoder (which are GET requests from client components).

---

## Directory Conventions

### `src/modules/`
Business logic, grouped by domain. Each module typically has:
- `queries.ts` — read operations (called from Server Components)
- `actions.ts` — mutations (Server Actions, called from forms)
- `schemas.ts` — Zod schemas for validation
- `utils.ts` — pure calculations (used in both server and tests)

Modules have no UI — they export functions only.

### `src/app/`
Pages are thin. A page file's job is to:
1. Await `searchParams` / `params`
2. Call a query function to get data
3. Pass data to components

No business logic lives in page files.

### `src/components/`
Pure UI. Components receive typed props and render. Client components (`"use client"`) are used only when interactivity requires it (comboboxes, forms with local state, inline editors).

### `src/lib/`
Infrastructure. Nothing in `lib/` knows about specific business domains.

---

## Route Groups

```
src/app/
├── (auth)/         # Login, signup — no sidebar layout
├── (dashboard)/    # Main app — sidebar + header layout
├── (print)/        # Print pages — bare HTML layout, no sidebar
└── customer-portal/  # Public token pages — no auth required
```

The `(print)` group has its own `layout.tsx` that renders a plain `<html>` document with no navigation, styled for printing. This lets print pages live at the same URL paths as dashboard pages without conflicting layouts.

---

## Integration Adapters

All external services are accessed through interfaces in `src/lib/integrations/`. The active implementation is selected in `index.ts`:

```
src/lib/integrations/
├── email/
│   ├── types.ts          # EmailProvider interface
│   ├── resend-adapter.ts # Concrete Resend implementation
│   └── index.ts          # Exports active adapter
├── sms/                  # Twilio adapter
├── payments/             # Stripe adapter
└── storage/              # Supabase Storage adapter
```

Business logic calls `emailProvider.send(...)` — it never imports Resend directly. Swapping providers means updating only the adapter file and `index.ts`.

---

## Database Schema Design

Key decisions:

**IDs** — CUIDs everywhere. URL-safe, globally unique, no sequential count leakage.

**Tenant-scoped sequential numbers** — Estimates, work orders, and invoices have human-readable numbers (EST-0001, WO-0001, INV-0001). These are scoped per tenant via `@@unique([tenantId, number])`. A raw SQL query with `SELECT MAX(number)` generates the next sequence number inside a transaction.

**Money** — All monetary values use `Decimal(10,2)` (Prisma `Decimal` type, PostgreSQL `NUMERIC`). Never floats.

**Line item copying** — When an estimate becomes a work order, and when a work order becomes an invoice, line items are **copied** (not linked). This allows each document to diverge independently. The origin is tracked via foreign keys (`workOrder.estimateId`, `invoice.workOrderId`) but the data is independent.

**Status history** — Every work order status transition creates a `WorkOrderStatusHistory` record with `fromStatus`, `toStatus`, timestamp, and the user who made the change.

**Estimate versioning** — Every save of an estimate creates an `EstimateVersion` record with a JSON snapshot of the line items and totals. This provides a full audit trail of price changes.

**Indexes** — Every common query pattern has a composite index starting with `tenantId`. For example: `@@index([tenantId, status])`, `@@index([tenantId, createdAt])`.

---

## Cron Jobs

Four scheduled jobs run via Vercel Cron (configured in `vercel.json`). Each is a Next.js API Route Handler at `src/app/api/cron/[job]/route.ts`.

All cron routes validate an `Authorization: Bearer <CRON_SECRET>` header before doing any work. The secret is set as an environment variable.

| Route | Runs | Action |
|---|---|---|
| `/api/cron/mark-overdue` | Daily 9 AM UTC | Sets unpaid past-due invoices to OVERDUE status |
| `/api/cron/expire-estimates` | Daily 9 AM UTC | Sets sent estimates older than 30 days to EXPIRED |
| `/api/cron/appointment-reminders` | Daily 8 AM UTC | Sends SMS to customers with appointments today |
| `/api/cron/service-reminders` | Daily 10 AM UTC | Emails customers whose vehicles have service due ≤7 days out |

---

## Customer Portal

Three public pages accessible without login, identified by a UUID token stored on the record:

- `Estimate.shareToken` → `/customer-portal/estimates/[token]`
- `Invoice.shareToken` → `/customer-portal/invoices/[token]`
- `Inspection.shareToken` → `/customer-portal/inspection/[token]`

Tokens are generated with `crypto.randomUUID()` when a document is first sent. Customers can approve/decline estimates and pay invoices through these pages. The routes are in `src/app/customer-portal/` which has no auth middleware.

---

## Testing

**Unit tests** (`tests/unit/`, Vitest) — fast, no database, no network. Cover:
- `calculateTotals` and line item math in `estimates/utils.ts`
- `parseLineItemsFromFormData`
- Zod schema validation (customer, vehicle, estimate schemas)
- Work order status transition logic (`workflow.ts`)
- RBAC permission checks (`permissions.ts`)
- Format utilities

**E2E tests** (`tests/e2e/`, Playwright) — run against a real browser with `pnpm dev`. Cover the full auth flow: signup, email confirm redirect, login, logout, forgot password, protected route redirect.

**CI** — GitHub Actions runs lint, typecheck, format check, and unit tests on every push and PR. E2E tests are not run in CI (requires a live Supabase connection).
