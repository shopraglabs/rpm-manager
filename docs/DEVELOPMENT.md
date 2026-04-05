# Development Guide

Day-to-day reference for working on RPM Manager.

---

## First-Time Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase project details

# 3. Run database migrations
pnpm db:migrate

# 4. (Optional) Load demo data
pnpm db:seed

# 5. Start the dev server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign up. The first account becomes the shop Owner.

---

## Common Tasks

### Add a new page

Pages live in `src/app/(dashboard)/[section]/page.tsx`. They should:
- Be async Server Components
- Await `searchParams` and `params` before use (Next.js 15 requires this — they are Promises)
- Call a query function from `src/modules/[domain]/queries.ts`
- Pass typed data down to components

```tsx
export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const data = await getMyData({ page: page ? parseInt(page) : 1 })
  return <MyComponent data={data} />
}
```

### Add a new server action

Actions live in `src/modules/[domain]/actions.ts` and must start with `"use server"`.

```ts
"use server"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"
import { revalidatePath } from "next/cache"

export async function doSomething(formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "resource:action")

  // validate with Zod
  // run Prisma mutation with tenantId
  // revalidatePath(...)
  // redirect(...) or return { error: "..." }
}
```

### Add a new database model

1. Edit `prisma/schema.prisma` — add the model with `tenantId String` and appropriate indexes
2. Run `pnpm db:migrate` — Prisma creates and applies the migration
3. The Prisma client regenerates automatically

### Add a new route to the sidebar

Edit `src/components/layout/app-sidebar.tsx` — add an entry to the `NAV_ITEMS` array:

```ts
{ label: "My Section", href: "/my-section", icon: SomeIcon }
```

---

## Code Conventions

### TypeScript
- All new code must be TypeScript with no `any`
- Prefer inferring types from Prisma queries (`Awaited<ReturnType<typeof getMyQuery>>`) over manual type declarations for DB results
- Use `NonNullable<Awaited<typeof query>>` when Prisma `findFirst` includes relations that TypeScript doesn't automatically surface

### Prisma queries
- Always include `tenantId` in every `where` clause — never query without it
- Use `include` for related data you know you'll render; use `select` to limit fields on list queries
- Money fields are `Prisma.Decimal` — call `.toNumber()` to format, never do math on them directly

### Server Actions
- Always call `requireAuth()` first, before doing anything
- Always call `requirePermission()` before any mutation
- Always validate with Zod before touching the database
- Return `{ error: string }` for user-facing errors; throw for unexpected failures
- Call `revalidatePath()` after mutations that affect list or detail pages

### Components
- Default to Server Components — add `"use client"` only when you need `useState`, `useEffect`, event handlers, or browser APIs
- Keep components pure: they receive props and render, they don't fetch data
- For forms, use the `EstimateFormShell` wrapper (handles error display and the submit button loading state)

### Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions: `camelCase`
- Server actions: verb first — `createCustomer`, `updateWorkOrder`, `deleteInvoice`
- Query functions: noun first — `getCustomer`, `getWorkOrders`, `getDashboardStats`

---

## Database Workflow

```bash
# Apply pending migrations to local DB and regenerate Prisma client
pnpm db:migrate

# Push schema changes directly (no migration file, for rapid prototyping)
pnpm db:push

# Open Prisma Studio (visual DB browser)
pnpm db:studio

# Manually regenerate the Prisma client (usually automatic)
pnpm db:generate
```

**Never use `db:push` on production.** Always create proper migrations with `db:migrate`.

Migrations run automatically on Vercel deployment (`prisma migrate deploy` in the build command, configured in `prisma.config.ts`).

---

## Testing

### Unit tests

```bash
pnpm test:unit          # Run all unit tests once
pnpm test:unit:watch    # Watch mode during development
```

Unit tests live in `tests/unit/`. They use Vitest and test pure functions — no database, no network. When you add a utility function or schema, add a corresponding test file.

### E2E tests

```bash
pnpm test:e2e           # Run Playwright tests (requires pnpm dev running)
pnpm test:e2e:ui        # Open Playwright UI mode
```

E2E tests live in `tests/e2e/`. They run against the real dev server. The setup file in `tests/setup.ts` handles any shared configuration.

### Before committing

```bash
pnpm lint       # Must pass with zero errors
pnpm typecheck  # Must pass with zero errors
pnpm test:unit  # Must all pass
```

CI enforces these on every push and pull request.

---

## Cron Jobs (Local Testing)

Cron jobs are standard API routes. To test them locally, call them directly with curl:

```bash
curl -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/cron/mark-overdue
```

Replace `your-cron-secret` with the value of `CRON_SECRET` in your `.env.local`.

---

## Troubleshooting

**"Cannot find module '../../src/app/page.js'" from TypeScript**
Delete the stale Next.js type cache: `rm -rf .next/types`

**Prisma client is out of date**
Run `pnpm db:generate` to regenerate, or `pnpm db:migrate` which regenerates automatically.

**Auth redirecting to login on every request**
Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly. The middleware reads the session cookie using these values.

**Stripe webhooks not arriving locally**
Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and update `STRIPE_WEBHOOK_SECRET` with the signing secret the CLI prints.

**Email not sending**
Check `RESEND_API_KEY` is set. Resend requires the `From` address to use a domain you've verified in the Resend dashboard. For local testing, Resend's free tier allows sending to your own email address.
