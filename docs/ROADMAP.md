# RPM Manager — Product Roadmap & Plan

## Context

Building a multi-tenant SaaS product for auto repair shops. The system manages the full repair order lifecycle: customer intake, estimates, work orders, digital inspections, parts, invoicing, and payments. Target market is independent auto repair shops.

**Constraints**: Solo developer, minimal coding experience, AI-assisted development, under $50/month infrastructure budget, no hard deadline. Web app only for MVP.

---

## Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** + TypeScript | Full-stack monolith, SSR + Server Actions, largest ecosystem for AI-assisted dev |
| UI | **shadcn/ui + Tailwind CSS** | Copy-paste components, accessible, highly customizable |
| Database | **PostgreSQL via Supabase** (free tier: 500MB) | Relational DB for complex business data, RLS for tenant isolation |
| ORM | **Prisma v7** | Type-safe queries, auto-migrations, 3x faster than v6 (no Rust engine) |
| Auth | **Supabase Auth** | Free 50K MAUs, JWT with custom claims for tenant_id/role |
| Storage | **Supabase Storage** | 1GB free, integrated with auth, for DVI photos/documents |
| Realtime | **Supabase Realtime** | Live job board updates (Phase 2) |
| Client State | **TanStack Query v5** (server) + **Zustand** (UI) | Clear separation, no over-engineering |
| Forms | **React Hook Form + Zod** | Shared validation schemas between client and server |
| Payments | **Stripe Connect** | Each shop connects their own Stripe; PCI handled by Stripe |
| Email | **Resend** | 3K/month free tier for transactional email |
| SMS | **Twilio** | Pay-per-message |
| Hosting | **Vercel Pro** ($20/mo) | Zero-config Next.js deployment, preview deploys on every PR |
| Package Manager | **pnpm** | Fast, disk-efficient |
| Testing | **Vitest** (unit/integration) + **Playwright** (E2E) | Official Next.js recommendations |

**Monthly cost**: ~$21/mo at launch (Vercel Pro $20 + domain $1). Scales to ~$56/mo at 10 paying shops.

---

## Architecture Overview

```
[Browser / PWA]
       |
       | HTTPS
       v
[Vercel Edge Network]
       |
       v
[Next.js 15 App Router - Monolith]
  |-- Server Components (SSR pages, data fetching via Prisma)
  |-- Server Actions (form mutations, Zod validation, RBAC checks)
  |-- API Route Handlers (webhooks: Stripe, Twilio; cron jobs)
  |-- Middleware (auth JWT validation, tenant resolution)
       |
       |--- [Prisma ORM] ---> [Supabase PostgreSQL + RLS]
       |--- [Supabase Auth] (JWT-based, HTTP-only cookies)
       |--- [Supabase Storage] (DVI photos, documents)
       |--- [Stripe Connect] (payment processing)
       |--- [Resend] (transactional email)
```

**Multi-tenancy**: Shared database, shared schema, `tenant_id` on every table. Two layers of isolation:
1. **Application layer**: `tenantId` injected into every Prisma query via `requireAuth()`
2. **Database layer**: PostgreSQL Row-Level Security policies enforce `tenant_id` matching JWT claim

**Auth flow**: Supabase Auth with email/password. JWT custom claims carry `tenant_id` and `role`. `@supabase/ssr` stores session as HTTP-only cookie. Middleware validates on every request.

**Data access**: Server Actions for mutations (built-in CSRF), Server Components with direct Prisma calls for reads. API Route Handlers only for webhooks, cron, and future external API.

---

## Database Schema (Core Entities)

```
Tenant (1) ---< User
Tenant (1) ---< Customer ---< Vehicle
Customer/Vehicle ---< Estimate ---< EstimateLineItem
Estimate ---< EstimateVersion (JSON snapshots)
Estimate (1) ---> (0..1) WorkOrder ---< WorkOrderLineItem
WorkOrder ---< Inspection ---< InspectionItem ---< InspectionPhoto
WorkOrder ---< WorkOrderStatusHistory
WorkOrder (1) ---> (0..1) Invoice ---< InvoiceLineItem
Invoice ---< Payment
Tenant ---< Appointment (linked to Vehicle, User)
Tenant ---< InventoryItem (linked to WorkOrderLineItem)
Tenant ---< ServiceReminder (linked to Vehicle)
Tenant ---< CannedJob
```

**Key design decisions**:
- CUID IDs (URL-safe, globally unique, no count leakage)
- Tenant-scoped sequential numbers (EST-0001, WO-0001, INV-0001) via `@@unique([tenantId, number])`
- `Decimal(10,2)` for all money fields (no floating-point errors)
- Composite indexes on `[tenantId, ...]` for every common query pattern
- Work order status workflow: PENDING → CHECKED_IN → IN_PROGRESS → WAITING_PARTS → WAITING_APPROVAL → QUALITY_CHECK → COMPLETED → READY_FOR_PICKUP → DELIVERED
- Line items copied (not linked) between estimate → work order → invoice so they can diverge independently

---

## Development Phases

### ✅ Phase 1: Foundation + Core Workflow — Complete

- [x] Project setup: Next.js 15, TypeScript, Tailwind, shadcn/ui, Prisma, Supabase, CI
- [x] Full database schema (all entities, relations, indexes)
- [x] Supabase Auth (email/password signup/login, middleware, tenant resolution)
- [x] RBAC (4 roles, permission map, enforced in every server action)
- [x] App shell (sidebar, header, command palette, responsive layout)
- [x] Customers — list with search/pagination, detail, create, edit, delete, tags, CSV import
- [x] Vehicles — list, detail, create, edit, delete, VIN decoder
- [x] Estimates — line item editor, calculations, status workflow, versioning, customer portal, email
- [x] Work Orders — convert from estimate, status workflow (9 statuses), status history, notes, kanban board
- [x] Invoices — generate from work order, record payments, Stripe Connect, customer portal
- [x] Dashboard — KPI cards, recent activity, alerts, onboarding guide

### ✅ Phase 2: DVI + Scheduling + Inventory — Complete

- [x] Digital Vehicle Inspections — templates, Good/Fair/Poor/Urgent ratings, customer-facing report
- [x] Appointments — week-strip calendar, day view, status workflow, customer picker, SMS reminders
- [x] Inventory — parts catalog, stock tracking, low-stock alerts, auto-deduction on WO completion
- [x] Service reminders — date/mileage based, dashboard surfacing, automated email cron
- [x] Canned jobs (service templates)
- [x] User management + RBAC UI
- [x] PWA setup

### 🔲 Phase 3: Marketing + Reporting + Integrations

- [ ] Full reports dashboard (revenue, job count, ARO, tech productivity, parts margin)
- [ ] Communication history log per customer
- [ ] Automated follow-up sequences (post-service, declined estimate re-engagement)
- [ ] QuickBooks Online integration (sync invoices and payments)
- [ ] Parts supplier catalog integration (parts pricing lookup)
- [ ] Multi-location support (one tenant, multiple shop locations)
- [ ] Labor rate matrix (different rates per job type or technician)
- [ ] Customer-facing review request flow

### 🔲 Phase 4: Mobile + Desktop

- [ ] React Native (Expo) mobile app for technicians
- [ ] REST API layer reusing existing modules
- [ ] Push notifications
- [ ] Barcode scanning for parts

### 🔲 Phase 5: AI Features (ongoing)

- [ ] AI estimate generation from vehicle symptoms
- [ ] Diagnostic assistant (suggest likely repairs from reported issues)
- [ ] Predictive maintenance recommendations based on vehicle history

---

## Security Plan

- **Auth**: Supabase Auth, JWT with `tenant_id`/`role` claims, HTTP-only cookies, short-lived access tokens (1h) + refresh tokens
- **RBAC**: Permission map in `src/lib/auth/permissions.ts`. Roles: OWNER, MANAGER, SERVICE_WRITER, TECHNICIAN. Enforced in every Server Action
- **Tenant isolation**: Application-layer `tenantId` filtering + PostgreSQL RLS (DB layer)
- **PCI**: Stripe Elements handles all card data; never touches our server
- **XSS/CSRF**: React auto-escaping, Server Actions built-in CSRF, Content-Security-Policy headers
- **Input validation**: Zod on every Server Action and API route
- **SQL injection**: Prisma parameterized queries
- **Security headers**: X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy

---

## Integration Abstraction (Port/Adapter Pattern)

Every external service accessed through an interface. Concrete adapter can be swapped without changing business logic.

```
src/lib/integrations/
  email/types.ts           # EmailProvider interface
  email/resend-adapter.ts  # concrete Resend implementation
  email/index.ts           # exports active adapter
  sms/                     # Twilio adapter
  payments/                # Stripe adapter
  storage/                 # Supabase Storage adapter
  vin-decoder/             # NHTSA adapter
```

---

## Testing Strategy

- **Unit tests** (Vitest): Zod schemas, utility functions, calculations, workflow transitions, RBAC checks. Target 80% coverage on `src/modules/` and `src/lib/`
- **Integration tests** (Vitest + test DB): Server Actions CRUD, tenant isolation, estimate→WO→invoice conversion
- **E2E tests** (Playwright): Full auth flow, complete repair order lifecycle, customer portal, RBAC UI. ~10 critical paths

---

## DevOps

- **Git**: Trunk-based development, short-lived feature branches, Conventional Commits
- **CI**: GitHub Actions on every PR (lint, typecheck, unit tests)
- **Deploy**: Vercel auto-deploys preview on PR, production on merge to main
- **DB migrations**: `prisma migrate dev` locally, `prisma migrate deploy` in Vercel build
- **Environments**: Local (Supabase project), Preview (same Supabase project), Production (separate Supabase project)

---

## Verification Checklist (per phase)

1. `pnpm lint && pnpm typecheck` — zero errors
2. `pnpm test:unit` — all pass
3. `pnpm test:e2e` — all critical paths pass
4. Manual walkthrough: create customer → add vehicle → write estimate → approve via customer portal → convert to WO → update status → generate invoice → pay via Stripe → verify on dashboard
5. Tenant isolation test: two demo shops, verify no data leaks between them
6. RBAC test: log in as each role, verify correct access and locked-out actions
