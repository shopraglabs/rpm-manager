import type { Metadata } from "next"
import Link from "next/link"
import { ClipboardList } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { formatDateTime } from "@/lib/utils/format"

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

export default async function InspectionsPage() {
  const { tenantId } = await requireAuth()

  const inspections = await prisma.inspection.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      workOrder: { select: { id: true, orderNumber: true } },
      vehicle: { select: { year: true, make: true, model: true } },
      technician: { select: { firstName: true, lastName: true } },
      items: { select: { condition: true } },
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inspections</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {inspections.length} inspection{inspections.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {inspections.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No inspections yet.</p>
          <p className="text-muted-foreground text-xs mt-1">
            Start an inspection from a work order.
          </p>
        </div>
      ) : (
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
                  Conditions
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inspections.map((insp) => {
                const conditionCounts = insp.items.reduce<Record<string, number>>((acc, item) => {
                  acc[item.condition] = (acc[item.condition] ?? 0) + 1
                  return acc
                }, {})

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
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Link
                        href={`/work-orders/${insp.workOrder.id}`}
                        className="font-mono text-xs text-muted-foreground hover:underline"
                      >
                        {insp.workOrder.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
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
                      {formatDateTime(insp.createdAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
