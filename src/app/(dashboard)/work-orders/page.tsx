import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getWorkOrders } from "@/modules/work-orders/queries"
import { formatDate } from "@/lib/utils/format"

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
  QUALITY_CHECK: "Quality Check",
  COMPLETED: "Completed",
  READY_FOR_PICKUP: "Ready for Pickup",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-muted-foreground",
  NORMAL: "text-foreground",
  HIGH: "text-orange-600 font-semibold",
  URGENT: "text-red-600 font-bold",
}

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const { page, search, status } = await searchParams
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
        <Button render={<Link href="/work-orders/new" />}>
          <Plus className="h-4 w-4 mr-2" />
          New Work Order
        </Button>
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">No work orders yet.</p>
          <Button variant="outline" size="sm" className="mt-4" render={<Link href="/work-orders/new" />}>
            Create first work order
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Number</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Vehicle</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Priority</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Assigned</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.items.map((wo) => (
                <tr key={wo.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/work-orders/${wo.id}`} className="font-mono font-medium hover:underline block">
                      {wo.orderNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {wo.customer.firstName} {wo.customer.lastName}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {wo.vehicle.year ? `${wo.vehicle.year} ` : ""}{wo.vehicle.make} {wo.vehicle.model}
                    {wo.vehicle.licensePlate && (
                      <span className="ml-1 text-xs">({wo.vehicle.licensePlate})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={STATUS_COLORS[wo.status] ?? ""}>
                      {STATUS_LABELS[wo.status] ?? wo.status}
                    </Badge>
                  </td>
                  <td className={`px-4 py-3 hidden lg:table-cell text-xs ${PRIORITY_COLORS[wo.priority] ?? ""}`}>
                    {wo.priority}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                    {wo.assignedTo
                      ? `${wo.assignedTo.firstName} ${wo.assignedTo.lastName}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {formatDate(wo.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
