import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LineItemEditor } from "@/components/estimates/line-item-editor"
import { EstimateFormShell } from "@/components/estimates/estimate-form-shell"
import { getWorkOrder, getTechnicians } from "@/modules/work-orders/queries"
import { updateWorkOrder, deleteWorkOrder } from "@/modules/work-orders/actions"
import { requireAuth } from "@/lib/auth/session"

export const metadata: Metadata = { title: "Edit Work Order" }

export default async function EditWorkOrderPage({
  params,
}: {
  params: Promise<{ workOrderId: string }>
}) {
  const { workOrderId } = await params
  const { tenantId } = await requireAuth()
  const [wo, technicians] = await Promise.all([
    getWorkOrder(workOrderId),
    getTechnicians(tenantId),
  ])

  if (!wo) notFound()
  if (["DELIVERED", "CANCELLED"].includes(wo.status)) {
    redirect(`/work-orders/${workOrderId}`)
  }

  const updateWithId = updateWorkOrder.bind(null, workOrderId)
  const deleteWithId = deleteWorkOrder.bind(null, workOrderId)

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href={`/work-orders/${workOrderId}`} />}>
          <ChevronLeft className="h-4 w-4" />
          {wo.orderNumber}
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Work Order</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {wo.customer.firstName} {wo.customer.lastName} ·{" "}
          {wo.vehicle.year ? `${wo.vehicle.year} ` : ""}{wo.vehicle.make} {wo.vehicle.model}
        </p>
      </div>

      <EstimateFormShell
        action={updateWithId}
        submitLabel="Save Changes"
        cancelSlot={
          <Button type="button" variant="outline" render={<Link href={`/work-orders/${workOrderId}`} />}>
            Cancel
          </Button>
        }
        deleteSlot={
          <form action={async () => { await deleteWithId() }} onSubmit={(e) => {
            if (!confirm("Delete this work order? This cannot be undone.")) e.preventDefault()
          }}>
            <Button type="submit" variant="destructive" size="sm">Delete</Button>
          </form>
        }
      >
        {/* Fixed fields passed as hidden */}
        <input type="hidden" name="customerId" value={wo.customerId} />
        <input type="hidden" name="vehicleId" value={wo.vehicleId} />

        {/* Details */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-medium mb-4">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue={wo.priority}>
                <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assign technician</Label>
              <Select name="assignedToId" defaultValue={wo.assignedToId ?? ""}>
                <SelectTrigger id="assignedToId">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileageIn">Mileage in</Label>
              <Input
                id="mileageIn"
                name="mileageIn"
                type="number"
                min={0}
                defaultValue={wo.mileageIn ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promisedDate">Promised date</Label>
              <Input
                id="promisedDate"
                name="promisedDate"
                type="date"
                defaultValue={
                  wo.promisedDate
                    ? new Date(wo.promisedDate).toISOString().split("T")[0]
                    : ""
                }
              />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-medium mb-4">Labor &amp; Parts</h2>
          <LineItemEditor
            defaultItems={wo.lineItems.map((item) => ({
              type: item.type,
              description: item.description,
              quantity: item.quantity.toNumber(),
              unitPrice: item.unitPrice.toNumber(),
              laborHours: item.laborHours?.toNumber() ?? null,
              partNumber: item.partNumber,
              sortOrder: item.sortOrder,
            }))}
          />
        </div>

        {/* Notes */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-medium">Notes</h2>
          <div className="space-y-2">
            <Label htmlFor="notes">Customer-visible notes</Label>
            <Textarea id="notes" name="notes" defaultValue={wo.notes ?? ""} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal notes</Label>
            <Textarea id="internalNotes" name="internalNotes" defaultValue={wo.internalNotes ?? ""} rows={2} />
          </div>
        </div>
      </EstimateFormShell>
    </div>
  )
}
