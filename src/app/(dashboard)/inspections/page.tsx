import type { Metadata } from "next"
import Link from "next/link"
import { ClipboardList } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "@/components/ui/search-bar"
import { PaginationNav } from "@/components/ui/pagination-nav"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { formatDate } from "@/lib/utils/format"
import { PAGINATION_PAGE_SIZE } from "@/lib/utils/constants"

export const metadata: Metadata = { title: "Inspections" }

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  SENT: "Sent",
  VIEWED: "Viewed",
}

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-yellow-50 text-yellow-700 border-yellow-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  VIEWED: "bg-purple-50 text-purple-700 border-purple-200",
}

const CONDITION_DOT: Record<string, string> = {
  GOOD: "bg-green-500",
  FAIR: "bg-yellow-500",
  POOR: "bg-orange-500",
  URGENT: "bg-red-500",
}

export default async function InspectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const { page, search, status } = await searchParams
  const { tenantId } = await requireAuth()
  const currentPage = page ? parseInt(page) : 1

  const searchWhere = search
    ? {
        OR: [
          { workOrder: { orderNumber: { contains: search, mode: "insensitive" as const } } },
          { vehicle: { make: { contains: search, mode: "insensitive" as const } } },
          { vehicle: { model: { contains: search, mode: "insensitive" as const } } },
          { vehicle: { licensePlate: { contains: search, mode: "insensitive" as const } } },
          { technician: { firstName: { contains: search, mode: "insensitive" as const } } },
          { technician: { lastName: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {}

  const where = {
    tenantId,
    ...(status ? { status: status as never } : {}),
    ...searchWhere,
  }

  const [inspections, total] = await Promise.all([
    prisma.inspection.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGINATION_PAGE_SIZE,
      take: PAGINATION_PAGE_SIZE,
      include: {
        workOrder: { select: { id: true, orderNumber: true } },
        vehicle: { select: { year: true, make: true, model: true, licensePlate: true } },
        technician: { select: { firstName: true, lastName: true } },
        items: { select: { condition: true } },
      },
    }),
    prisma.inspection.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGINATION_PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inspections</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {total} inspection{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchBar
          placeholder="Search by vehicle, work order, tech…"
          initialValue={search ?? ""}
        />
        <div className="flex flex-wrap gap-1.5">
          {(["IN_PROGRESS", "COMPLETED", "SENT", "VIEWED"] as const).map((s) => {
            const isActive = status === s
            const sp = new URLSearchParams()
            if (search) sp.set("search", search)
            if (!isActive) sp.set("status", s)
            const href = `/inspections?${sp.toString()}`
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
              href={search ? `/inspections?search=${encodeURIComponent(search)}` : "/inspections"}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-background text-muted-foreground hover:border-muted-foreground transition-colors"
            >
              ✕ Clear
            </Link>
          )}
        </div>
      </div>

      {inspections.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {search || status ? "No inspections match your filters." : "No inspections yet."}
          </p>
          {!search && !status && (
            <p className="text-muted-foreground text-xs mt-1">
              Start an inspection from a work order.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vehicle</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                    Work Order
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                    Technician
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Findings
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inspections.map((insp) => {
                  const conditionCounts = insp.items.reduce<Record<string, number>>(
                    (acc, item) => {
                      acc[item.condition] = (acc[item.condition] ?? 0) + 1
                      return acc
                    },
                    {}
                  )

                  const vehicleLabel = [insp.vehicle.year, insp.vehicle.make, insp.vehicle.model]
                    .filter(Boolean)
                    .join(" ")

                  return (
                    <tr key={insp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/inspections/${insp.id}`}
                          className="font-medium hover:underline"
                        >
                          {vehicleLabel || "Unknown"}
                        </Link>
                        {insp.vehicle.licensePlate && (
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {insp.vehicle.licensePlate}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Link
                          href={`/work-orders/${insp.workOrder.id}`}
                          className="font-mono text-xs text-muted-foreground hover:underline"
                        >
                          {insp.workOrder.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                        {insp.technician.firstName} {insp.technician.lastName}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {(["URGENT", "POOR", "FAIR", "GOOD"] as const).map((c) => {
                            const count = conditionCounts[c] ?? 0
                            if (count === 0) return null
                            return (
                              <div key={c} className="flex items-center gap-0.5">
                                <span className={`h-2 w-2 rounded-full ${CONDITION_DOT[c]}`} />
                                <span className="text-xs tabular-nums">{count}</span>
                              </div>
                            )
                          })}
                          {insp.items.length === 0 && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_COLORS[insp.status] ?? ""}`}
                        >
                          {STATUS_LABELS[insp.status] ?? insp.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {formatDate(insp.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <PaginationNav
                page={currentPage}
                totalPages={totalPages}
                total={total}
                pageSize={PAGINATION_PAGE_SIZE}
                buildHref={(p) => {
                  const sp = new URLSearchParams()
                  sp.set("page", String(p))
                  if (search) sp.set("search", search)
                  if (status) sp.set("status", status)
                  return `/inspections?${sp.toString()}`
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
