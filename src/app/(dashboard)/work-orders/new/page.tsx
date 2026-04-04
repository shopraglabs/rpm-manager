import type { Metadata } from "next"
import Link from "next/link"
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
import { CustomerVehicleSelector } from "@/components/estimates/customer-vehicle-selector"
import { LineItemEditor } from "@/components/estimates/line-item-editor"
import { EstimateFormShell } from "@/components/estimates/estimate-form-shell"
import { createWorkOrder } from "@/modules/work-orders/actions"
import { getTechnicians } from "@/modules/work-orders/queries"
import { getCannedJobs } from "@/modules/canned-jobs/queries"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export const metadata: Metadata = { title: "New Work Order" }

export default async function NewWorkOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; vehicleId?: string; estimateId?: string }>
}) {
  const {
    customerId: defaultCustomerId,
    vehicleId: defaultVehicleId,
    estimateId,
  } = await searchParams
  const { tenantId } = await requireAuth()

  const [customers, technicians, cannedJobs] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        vehicles: {
          select: { id: true, year: true, make: true, model: true, trim: true, licensePlate: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getTechnicians(tenantId),
    getCannedJobs({ activeOnly: true }),
  ])

  const customerVehicles = Object.fromEntries(customers.map((c) => [c.id, c.vehicles]))

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/work-orders" />}>
          <ChevronLeft className="h-4 w-4" />
          Work Orders
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">New Work Order</h1>
      </div>

      <EstimateFormShell
        action={createWorkOrder}
        submitLabel="Create Work Order"
        cancelSlot={
          <Button type="button" variant="outline" render={<Link href="/work-orders" />}>
            Cancel
          </Button>
        }
      >
        {/* Hidden estimate link */}
        {estimateId && <input type="hidden" name="estimateId" value={estimateId} />}

        {/* Customer + Vehicle */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-medium mb-4">Customer &amp; Vehicle</h2>
          <CustomerVehicleSelector
            customers={customers}
            defaultCustomerId={defaultCustomerId}
            defaultVehicleId={defaultVehicleId}
            customerVehicles={customerVehicles}
          />
        </div>

        {/* Work order details */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-medium mb-4">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="NORMAL">
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
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
              <Select name="assignedToId" defaultValue="">
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
              <Input id="mileageIn" name="mileageIn" type="number" min={0} placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promisedDate">Promised date</Label>
              <Input id="promisedDate" name="promisedDate" type="date" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-medium mb-4">Labor &amp; Parts</h2>
          <LineItemEditor cannedJobs={cannedJobs} />
        </div>

        {/* Notes */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-medium">Notes</h2>
          <div className="space-y-2">
            <Label htmlFor="notes">Customer-visible notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Notes visible to the customer…"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal notes</Label>
            <Textarea
              id="internalNotes"
              name="internalNotes"
              placeholder="Internal shop notes…"
              rows={2}
            />
          </div>
        </div>
      </EstimateFormShell>
    </div>
  )
}
