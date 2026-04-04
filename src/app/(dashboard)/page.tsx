import type { Metadata } from "next"
import Link from "next/link"
import { Wrench, FileText, TrendingUp, TrendingDown, Car, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { requireAuth } from "@/lib/auth/session"
import { getDashboardStats } from "@/modules/dashboard/queries"
import { formatCurrency, formatDate } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Dashboard" }

const WO_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  CHECKED_IN: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-yellow-50 text-yellow-700 border-yellow-200",
  WAITING_PARTS: "bg-orange-50 text-orange-700 border-orange-200",
  WAITING_APPROVAL: "bg-purple-50 text-purple-700 border-purple-200",
  QUALITY_CHECK: "bg-cyan-50 text-cyan-700 border-cyan-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  READY_FOR_PICKUP: "bg-green-50 text-green-600 border-green-200",
  DELIVERED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
}

const WO_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  WAITING_PARTS: "Waiting Parts",
  WAITING_APPROVAL: "Waiting Approval",
  QUALITY_CHECK: "QC",
  COMPLETED: "Completed",
  READY_FOR_PICKUP: "Pickup Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
}

const INV_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  PARTIALLY_PAID: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  VOID: "bg-muted text-muted-foreground",
}

const INV_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIALLY_PAID: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
}

export default async function DashboardPage() {
  const [user, stats] = await Promise.all([requireAuth(), getDashboardStats()])

  const growthPositive = (stats.monthGrowth ?? 0) >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user.firstName}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Open Work Orders */}
        <Link
          href="/work-orders"
          className="rounded-xl border bg-card p-5 shadow-sm hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Open Work Orders</p>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold tabular-nums">{stats.openWorkOrders}</p>
          {stats.readyForPickup > 0 && (
            <p className="text-xs text-green-600 mt-1.5 font-medium">
              {stats.readyForPickup} ready for pickup
            </p>
          )}
        </Link>

        {/* Unpaid Invoices */}
        <Link
          href="/invoices?status=SENT"
          className="rounded-xl border bg-card p-5 shadow-sm hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Unpaid Invoices</p>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold tabular-nums">{stats.unpaidInvoices}</p>
          {stats.overdueTotal > 0 && (
            <p className="text-xs text-destructive mt-1.5 font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formatCurrency(stats.overdueTotal)} overdue
            </p>
          )}
        </Link>

        {/* Revenue Today */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Revenue Today</p>
            <Car className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold tabular-nums">{formatCurrency(stats.revenueToday)}</p>
          <p className="text-xs text-muted-foreground mt-1.5">payments collected</p>
        </div>

        {/* Revenue This Month */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Revenue This Month</p>
            {stats.monthGrowth !== null ? (
              growthPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )
            ) : null}
          </div>
          <p className="text-3xl font-bold tabular-nums">{formatCurrency(stats.revenueMonth)}</p>
          {stats.monthGrowth !== null && (
            <p
              className={`text-xs mt-1.5 font-medium ${growthPositive ? "text-green-600" : "text-destructive"}`}
            >
              {growthPositive ? "+" : ""}
              {stats.monthGrowth.toFixed(1)}% vs last month
            </p>
          )}
        </div>
      </div>

      {/* Recent activity — two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Work Orders */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-medium">Recent Work Orders</h2>
            <Link
              href="/work-orders"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          </div>

          {stats.recentWorkOrders.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No work orders yet.
            </div>
          ) : (
            <ul className="divide-y">
              {stats.recentWorkOrders.map((wo) => (
                <li key={wo.id}>
                  <Link
                    href={`/work-orders/${wo.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{wo.orderNumber}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${WO_STATUS_COLORS[wo.status] ?? ""}`}
                        >
                          {WO_STATUS_LABELS[wo.status] ?? wo.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {wo.customer.firstName} {wo.customer.lastName} ·{" "}
                        {wo.vehicle.year ? `${wo.vehicle.year} ` : ""}
                        {wo.vehicle.make} {wo.vehicle.model}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-3 shrink-0">
                      {formatDate(wo.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-medium">Recent Invoices</h2>
            <Link
              href="/invoices"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          </div>

          {stats.recentInvoices.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No invoices yet.
            </div>
          ) : (
            <ul className="divide-y">
              {stats.recentInvoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{inv.invoiceNumber}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${INV_STATUS_COLORS[inv.status] ?? ""}`}
                        >
                          {INV_STATUS_LABELS[inv.status] ?? inv.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {inv.customer.firstName} {inv.customer.lastName}
                      </p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-sm font-medium tabular-nums">
                        {formatCurrency(inv.total.toNumber())}
                      </p>
                      {inv.amountDue.toNumber() > 0 && inv.status !== "VOID" && (
                        <p className="text-xs text-destructive tabular-nums">
                          {formatCurrency(inv.amountDue.toNumber())} due
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
