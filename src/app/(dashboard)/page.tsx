import type { Metadata } from "next"
import { requireAuth } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening at your shop today.
        </p>
      </div>

      {/* Dashboard KPI cards — to be built in Phase 1 completion */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Open Work Orders", value: "—" },
          { label: "Ready for Pickup", value: "—" },
          { label: "Unpaid Invoices", value: "—" },
          { label: "Revenue Today", value: "—" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border bg-card p-6 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
