# Changelog

All notable changes to RPM Manager are documented here.

---

## [Unreleased]

Changes built but not yet assigned a version number.

### Added
- **Appointments week strip calendar** — persistent Mon–Sun mini-calendar above the day view with per-day appointment counts and week navigation
- **Appointment customer picker** — search existing customers when scheduling; auto-fills name, phone, and email; optional vehicle selection
- **Customer CSV import** — bulk import customers from a CSV file; supports flexible column naming, email deduplication, up to 5,000 rows, and per-row error reporting
- **Customer table: last visit & open balance columns** — see when a customer last brought a vehicle in and whether they have an outstanding balance
- **Work orders list: promised date column** — highlights past-due promise dates in red
- **Work orders list: total column** — shows line-item total with a note when no invoice exists
- **Invoices list: due date column** — highlights overdue due dates in red
- **Estimate revision history** — collapsible panel on the estimate detail page showing every saved revision with its line items and total
- **Onboarding card on dashboard** — getting-started guide shown to new shops with no work order activity; auto-hides once the shop is active

### Fixed
- Root route conflict — removed the Next.js starter template `app/page.tsx` that was shadowing the dashboard for logged-in users

---

## [0.5.0] — 2026-04-04

### Added
- **Global search command palette** (`⌘K`) — searches customers, work orders, estimates, invoices, and vehicles with keyboard navigation
- **Printable repair order** — full print layout for work orders at `/work-orders/[id]/print`
- **Dashboard alerts panel** — surfaces overdue promised dates, low inventory, and today's appointments
- **SMS notifications** — manual send from customer detail; appointment reminder button on the appointments calendar
- **Customer timeline** — unified activity feed on customer detail page showing estimates, work orders, and invoices in chronological order
- **Appointment edit page** with full field support
- **AR aging report** on the reports page (current, 1–30, 31–60, 61–90, 90+ days buckets)
- **After-service thank-you email** with review request link sent when a work order is marked Delivered
- **Automated cron jobs** — daily runs for: marking invoices overdue, expiring old estimates, sending appointment SMS reminders, sending service reminder emails
- **Vehicle service reminders** — create date/mileage-based reminders on any vehicle; upcoming reminders surface on the dashboard
- **Inventory auto-deduction** — parts used in a work order are deducted from stock on completion
- **Labor rate auto-fill** — LABOR line items default to the shop's configured labor rate
- **Mileage-out capture** — prompt to record odometer reading when completing or delivering a work order
- **Inventory search in line item editor** — search parts catalog when adding PART line items; auto-fills price
- **Quick internal notes on work orders** — add technician notes inline without going to the edit page
- **Stripe Connect integration** — shops connect their own Stripe account in Settings → Billing; customers pay invoices via the customer portal
- **Canned jobs (service templates)** — create reusable labor/part bundles that can be inserted into any estimate or work order
- **Print-friendly estimate and invoice pages** in a sidebar-free layout
- **Estimate duplication** — clone any estimate as a new draft
- **Estimate expiry** — sent estimates auto-expire after 30 days via cron
- **Mark Approved / Declined buttons** — record verbal approvals directly on the estimate detail page without going through the customer portal
- **Invoice resend button** for SENT, OVERDUE, and PARTIALLY_PAID invoices
- **View Portal button** on estimate and invoice detail pages
- **Create Work Order button on appointments** — appears when an appointment is marked Arrived (links vehicle and customer)
- **Past-promised-date alert on dashboard** — lists work orders that missed their promise date
- **Status filter chips** on estimates, work orders, and invoices list pages
- **Customer tags** — freeform comma-separated tags, editable from the customer form
- **Reports period selector** — switch between 3, 6, and 12-month windows
- **Vehicles list page** with search and pagination
- **New Work Order shortcut buttons** on customer and vehicle detail pages

---

## [0.4.0] — 2026-04-03

### Added
- **PWA support** — manifest, service worker, installable on mobile
- **Email integration (Resend)** — transactional email for estimates and invoices
- **VIN decoder** — NHTSA API integration; decodes year, make, model, trim, engine, and transmission from a 17-character VIN
- **Reports page** — revenue chart, work order volume, top services, tech productivity, AR aging
- **Playwright E2E tests** — 14 passing tests covering the auth flow and critical paths
- **Unit tests (Vitest)** — 117 passing tests covering calculations, schemas, workflow logic, and RBAC

---

## [0.3.0] — 2026-04-03

### Added
- **Digital Vehicle Inspections (DVI)** — technician-facing inspection form with Good/Fair/Poor/Urgent condition ratings per item, notes per item, and a photo placeholder
- **Inspection customer portal** — shareable token link with color-coded condition report
- **Kanban board view** for work orders — columns for each active status
- **Customer portal for estimates and invoices** — shareable token-based pages, no login required
- **Pagination** on all list pages using a shared `PaginationNav` component
- **Search** on all list pages using a shared `SearchBar` component
- **Service history** on customer and vehicle detail pages
- **Development seed** with a complete demo shop (customers, vehicles, estimates, work orders, invoices)
- Global error, not-found, and loading pages

---

## [0.2.0] — 2026-04-03

### Added
- **Dashboard** with KPI cards (open work orders, unpaid invoices, revenue, upcoming appointments), recent work orders list, recent invoices list
- **Settings** — shop profile (name, address, phone, email, labor rate, tax rate, timezone), user profile, team management with role assignment
- **Appointments** — day-view calendar, create/edit/delete, status workflow (Scheduled → Confirmed → Arrived → Completed), SMS reminder button
- **Inventory** — parts catalog with cost, price, quantity on hand, reorder point, low-stock filter and alerts

---

## [0.1.0] — 2026-04-03

### Added
- **Project foundation** — Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma v7, Supabase Auth, ESLint, Prettier, Vitest, Playwright, Vercel config, GitHub Actions CI
- **Full database schema** — Tenant, User, Customer, Vehicle, Estimate, WorkOrder, Inspection, Appointment, InventoryItem, Invoice, Payment, ServiceReminder, CannedJob, and all supporting enums and relations
- **Authentication** — Supabase Auth email/password signup and login, JWT with `tenant_id` and `role` claims, HTTP-only cookie session, auth middleware
- **RBAC** — four roles (Owner, Manager, Service Writer, Technician) with a permission map enforced in every server action
- **Customers** — list with search and pagination, detail page with vehicles and service history, create, edit, delete
- **Vehicles** — create, edit, delete; linked to customer; service history
- **Estimates** — line item editor (labor, parts, sublet, fees, discounts), calculations (subtotal, tax, total), status workflow (Draft → Sent → Approved/Declined/Expired → Converted), versioning with JSON snapshots, send via email
- **Work Orders** — convert from estimate, line item editing, status workflow (9 statuses), status history audit log, internal and customer-visible notes, technician assignment, priority levels, promised date
- **Invoices** — generate from work order, record payments (cash, check, credit card, ACH), status tracking (Draft → Sent → Partially Paid → Paid / Overdue / Void), send via email
- **App shell** — sidebar navigation, header with global search trigger, responsive layout
