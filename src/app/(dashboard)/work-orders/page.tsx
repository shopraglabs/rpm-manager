import type { Metadata } from "next"
import Link from "next/link"
import { Plus, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "@/components/ui/search-bar"
import { PaginationNav } from "@/components/ui/pagination-nav"
import { getWorkOrders, getBoardWorkOrders } from "@/modules/work-orders/queries"
import { formatDate, formatCurrency } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Work Orders" }

const STATUS_COLORS: Record<string, string> = {
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

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  WAITING_PARTS: "Waiting Parts",
  WAITING_APPROVAL: "Waiting Approval",
  QUALITY_CHECK: "QC",
  COMPLETED: "Completed",
  READY_FOR_PICKUP: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-muted-foreground",
  NORMAL: "text-foreground",
  HIGH: "text-orange-600 font-semibold",
  URGENT: "text-red-600 font-bold",
}

// The columns shown in board view (active statuses only)
const BOARD_COLUMNS = [
  "PENDING",
  "CHECKED_IN",
  "IN_PROGRESS",
  "WAITING_PARTS",
  "WAITING_APPROVAL",
  "QUALITY_CHECK",
  "COMPLETED",
  "READY_FOR_PICKUP",
] as const

const BOARD_COLUMN_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  WAITING_PARTS: "Waiting Parts",
  WAITING_APPROVAL: "Waiting Approval",
  QUALITY_CHECK: "Quality Check",
  COMPLETED: "Completed",
  READY_FOR_PICKUP: "Ready for Pickup",
}

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; view?: string }>
}) {
  const { page, search, status, view } = await searchParams
  const isBoard = view === "board"

  if (isBoard) {
    const allWorkOrders = await getBoardWorkOrders()

    const byStatus = BOARD_COLUMNS.reduce<Record<string, typeof allWorkOrders>>((acc, col) => {
      acc[col] = allWorkOrders.filter((wo) => wo.status === col)
      return acc
    }, {})

    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Work Orders</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{allWorkOrders.length} active</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" render={<Link href="/work-orders" />}>
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/work-orders?view=board" />}
              className="bg-muted"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Board
            </Button>
            <Button render={<Link href="/work-orders/new" />}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        </div>

        {/* Kanban board — horizontal scroll */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {BOARD_COLUMNS.map((col) => {
              const cards = byStatus[col] ?? []
              return (
                <div key={col} className="w-56 shrink-0">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {BOARD_COLUMN_LABELS[col]}
                    </span>
                    {cards.length > 0 && (
                      <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 tabular-nums">
                        {cards.length}
                      </span>
                    )}
                  </div>

                  {/* Cards */}
                  <div className="space-y-2">
                    {cards.length === 0 && (
                      <div className="rounded-xl border border-dashed bg-card/50 p-4 text-center">
                        <p className="text-xs text-muted-foreground">Empty</p>
                      </div>
                    )}
                    {cards.map((wo) => {
                      const vehicleLabel = [wo.vehicle.year, wo.vehicle.make, wo.vehicle.model]
                        .filter(Boolean)
                        .join(" ")

                      return (
                        <Link
                          key={wo.id}
                          href={`/work-orders/${wo.id}`}
                          className="block rounded-xl border bg-card p-3 hover:shadow-sm hover:border-primary/30 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <span className="font-mono text-xs text-muted-foreground group-hover:text-primary">
                              {wo.orderNumber}
                            </span>
                            {wo.priority !== "NORMAL" && (
                              <span className={`text-xs ${PRIORITY_COLORS[wo.priority]}`}>
                                {wo.priority}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-sm leading-tight mb-0.5">
                            {wo.customer.firstName} {wo.customer.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {vehicleLabel || "Unknown vehicle"}
                          </p>
                          {wo.vehicle.licensePlate && (
                            <p className="text-xs text-muted-foreground/70 font-mono">
                              {wo.vehicle.licensePlate}
                            </p>
                          )}
                          {wo.assignedTo && (
                            <p className="text-xs text-muted-foreground mt-1.5 pt-1.5 border-t">
                              {wo.assignedTo.firstName} {wo.assignedTo.lastName}
                            </p>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Table view ─────────────────────────────────────────────
  const result = await getWorkOrders({
    page: page ? parseInt(page) : 1,
    search: search ?? undefined,
    status: status ?? undefined,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {result.total} work order{result.total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/work-orders" />}
            className="bg-muted"
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button variant="outline" size="sm" render={<Link href="/work-orders?view=board" />}>
            <LayoutGrid className="h-4 w-4 mr-2" />
            Board
          </Button>
          <Button render={<Link href="/work-orders/new" />}>
            <Plus className="h-4 w-4 mr-2" />
            New Work Order
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchBar placeholder="Search by order #, vehicle, plate…" initialValue={search ?? ""} />
        <div className="flex flex-wrap gap-1.5">
          {(["PENDING", "CHECKED_IN", "IN_PROGRESS", "WAITING_PARTS", "WAITING_APPROVAL", "QUALITY_CHECK", "COMPLETED", "READY_FOR_PICKUP"] as const).map((s) => {
            const isActive = status === s
            const sp = new URLSearchParams()
            if (search) sp.set("search", search)
            if (!isActive) sp.set("status", s)
            const href = `/work-orders?${sp.toString()}`
            return (
              <Link
                key={s}
                href={href}
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  isActive
                    ? `${STATUS_COLORS[s]} ring-1 ring-current`
                    : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                }`}
              >
                {STATUS_LABELS[s]}
              </Link>
            )
          })}
          {status && (
            <Link
              href={search ? `/work-orders?search=${encodeURIComponent(search)}` : "/work-orders"}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕ Clear
            </Link>
          )}
        </div>
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">No work orders yet.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            render={<Link href="/work-orders/new" />}
          >
            Create first work order
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Number</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Vehicle
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Priority
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Assigned
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Promise
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.items.map((wo) => (
                <tr key={wo.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/work-orders/${wo.id}`}
                      className="font-mono font-medium hover:underline block"
                    >
                      {wo.orderNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {wo.customer.firstName} {wo.customer.lastName}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {wo.vehicle.year ? `${wo.vehicle.year} ` : ""}
                    {wo.vehicle.make} {wo.vehicle.model}
                    {wo.vehicle.licensePlate && (
                      <span className="ml-1 text-xs">({wo.vehicle.licensePlate})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={STATUS_COLORS[wo.status] ?? ""}>
                      {STATUS_LABELS[wo.status] ?? wo.status}
                    </Badge>
                  </td>
                  <td
                    className={`px-4 py-3 hidden lg:table-cell text-xs ${PRIORITY_COLORS[wo.priority] ?? ""}`}
                  >
                    {wo.priority}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                    {wo.assignedTo ? `${wo.assignedTo.firstName} ${wo.assignedTo.lastName}` : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {wo.promisedDate ? (
                      (() => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const promised = new Date(wo.promisedDate)
                        promised.setHours(0, 0, 0, 0)
                        const isOverdue =
                          promised < today &&
                          !["DELIVERED", "COMPLETED", "READY_FOR_PICKUP"].includes(wo.status)
                        return (
                          <span
                            className={`text-sm ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}
                          >
                            {formatDate(wo.promisedDate)}
                          </span>
                        )
                      })()
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right hidden xl:table-cell">
                    {wo.total.toNumber() > 0 ? (
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(wo.total.toNumber())}
                        {!wo.invoice && (
                          <span className="block text-[10px] text-muted-foreground font-normal">
                            no invoice
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationNav
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
        buildHref={(p) => {
          const sp = new URLSearchParams()
          sp.set("page", String(p))
          if (search) sp.set("search", search)
          if (status) sp.set("status", status)
          return `/work-orders?${sp.toString()}`
        }}
      />
    </div>
  )
}
