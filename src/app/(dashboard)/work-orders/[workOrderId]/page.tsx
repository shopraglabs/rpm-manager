import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil, Printer, FileText, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusTransition, STATUS_LABELS } from "@/components/work-orders/status-transition"
import { QuickNote } from "@/components/work-orders/quick-note"
import { getWorkOrder } from "@/modules/work-orders/queries"
import { getWorkOrderInspection } from "@/modules/inspections/queries"
import { createInspection } from "@/modules/inspections/actions"
import { canGenerateInvoice } from "@/modules/work-orders/workflow"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Work Order" }

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

const LINE_ITEM_TYPE_LABELS: Record<string, string> = {
  LABOR: "Labor",
  PART: "Part",
  SUBLET: "Sublet",
  FEE: "Fee",
  DISCOUNT: "Discount",
}

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ workOrderId: string }>
}) {
  const { workOrderId } = await params
  const [wo, inspection] = await Promise.all([
    getWorkOrder(workOrderId),
    getWorkOrderInspection(workOrderId),
  ])
  if (!wo) notFound()

  const canEdit = !["DELIVERED", "CANCELLED"].includes(wo.status)
  const canInvoice = canGenerateInvoice(wo.status) && !wo.invoice
  const createInspectionWithId = createInspection.bind(null, workOrderId)

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/work-orders" />}>
          <ChevronLeft className="h-4 w-4" />
          Work Orders
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">{wo.orderNumber}</h1>
            <Badge variant="outline" className={STATUS_COLORS[wo.status] ?? ""}>
              {STATUS_LABELS[wo.status] ?? wo.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {wo.customer.firstName} {wo.customer.lastName} ·{" "}
            {wo.vehicle.year ? `${wo.vehicle.year} ` : ""}
            {wo.vehicle.make} {wo.vehicle.model}
            {wo.vehicle.licensePlate ? ` (${wo.vehicle.licensePlate})` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/work-orders/${workOrderId}/print`} target="_blank" />}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print RO
          </Button>
          {canInvoice && (
            <Button
              variant="outline"
              render={<Link href={`/invoices/new?workOrderId=${workOrderId}`} />}
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          )}
          {canEdit && (
            <Button render={<Link href={`/work-orders/${workOrderId}/edit`} />}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details card */}
          <div className="rounded-xl border bg-card p-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium mt-0.5">
                <Link href={`/customers/${wo.customer.id}`} className="hover:underline">
                  {wo.customer.firstName} {wo.customer.lastName}
                </Link>
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Vehicle</p>
              <p className="font-medium mt-0.5">
                <Link href={`/vehicles/${wo.vehicle.id}`} className="hover:underline">
                  {wo.vehicle.year ? `${wo.vehicle.year} ` : ""}
                  {wo.vehicle.make} {wo.vehicle.model}
                </Link>
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Priority</p>
              <p className="font-medium mt-0.5">{wo.priority}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Assigned to</p>
              <p className="font-medium mt-0.5">
                {wo.assignedTo ? `${wo.assignedTo.firstName} ${wo.assignedTo.lastName}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Mileage in</p>
              <p className="font-medium mt-0.5">
                {wo.mileageIn != null ? wo.mileageIn.toLocaleString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Promised date</p>
              <p className="font-medium mt-0.5">
                {wo.promisedDate ? formatDate(wo.promisedDate) : "—"}
              </p>
            </div>
            {wo.estimate && (
              <div className="col-span-2">
                <p className="text-muted-foreground">From estimate</p>
                <p className="font-medium mt-0.5">
                  <Link href={`/estimates/${wo.estimate.id}`} className="hover:underline font-mono">
                    {wo.estimate.estimateNumber}
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* Line items */}
          {wo.lineItems.length > 0 && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h2 className="font-medium">Labor &amp; Parts</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground hidden md:table-cell">
                      Type
                    </th>
                    <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                      Qty
                    </th>
                    <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                      Unit price
                    </th>
                    <th className="text-right px-5 py-2.5 font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {wo.lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3">
                        <p>{item.description}</p>
                        {item.partNumber && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {item.partNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground hidden md:table-cell">
                        {LINE_ITEM_TYPE_LABELS[item.type] ?? item.type}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {item.quantity.toString()}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {formatCurrency(item.unitPrice.toNumber())}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium">
                        {formatCurrency(item.total.toNumber())}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-4 border-t bg-muted/20 space-y-1 text-sm">
                <div className="flex justify-between max-w-xs ml-auto">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(wo.subtotal.toNumber())}
                  </span>
                </div>
                {wo.taxAmount.toNumber() > 0 && (
                  <div className="flex justify-between max-w-xs ml-auto">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(wo.taxAmount.toNumber())}
                    </span>
                  </div>
                )}
                <div className="flex justify-between max-w-xs ml-auto text-base font-semibold pt-1 border-t">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(wo.total.toNumber())}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {(wo.notes || wo.internalNotes) && (
            <div className="rounded-xl border bg-card p-5 space-y-4 text-sm">
              {wo.notes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Customer notes
                  </p>
                  <p className="whitespace-pre-wrap">{wo.notes}</p>
                </div>
              )}
              {wo.internalNotes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Internal notes
                  </p>
                  <p className="whitespace-pre-wrap">{wo.internalNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status transition */}
          <StatusTransition workOrderId={workOrderId} currentStatus={wo.status} />

          {/* Inspection */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Inspection</h3>
            </div>
            {inspection ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{inspection._count.items} items</span>
                  <Badge variant="outline" className="text-xs">
                    {inspection.status === "IN_PROGRESS"
                      ? "In Progress"
                      : inspection.status === "COMPLETED"
                        ? "Completed"
                        : inspection.status === "SENT"
                          ? "Sent"
                          : "Viewed"}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  render={<Link href={`/inspections/${inspection.id}`} />}
                >
                  View Inspection
                </Button>
              </div>
            ) : (
              <form
                action={async () => {
                  await createInspectionWithId()
                }}
              >
                <Button type="submit" variant="outline" size="sm" className="w-full">
                  Start Inspection
                </Button>
              </form>
            )}
          </div>

          {/* Quick note */}
          {canEdit && <QuickNote workOrderId={workOrderId} />}

          {/* Status history */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-medium text-sm mb-3">History</h3>
            <ol className="space-y-3">
              {wo.statusHistory.map((entry) => (
                <li key={entry.id} className="text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">
                      {STATUS_LABELS[entry.toStatus] ?? entry.toStatus}
                    </span>
                    <span className="text-muted-foreground">
                      · {formatDateTime(entry.createdAt)}
                    </span>
                  </div>
                  {entry.note && <p className="text-muted-foreground mt-0.5 ml-0">{entry.note}</p>}
                  {entry.changedBy && (
                    <p className="text-muted-foreground/70 mt-0.5">
                      by {entry.changedBy.firstName} {entry.changedBy.lastName}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
