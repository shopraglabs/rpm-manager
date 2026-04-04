import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CustomerVehicleSelector } from "@/components/estimates/customer-vehicle-selector"
import { LineItemEditor } from "@/components/estimates/line-item-editor"
import { EstimateFormShell } from "@/components/estimates/estimate-form-shell"
import { createEstimate } from "@/modules/estimates/actions"
import { getCannedJobs } from "@/modules/canned-jobs/queries"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export const metadata: Metadata = { title: "New Estimate" }

export default async function NewEstimatePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; vehicleId?: string }>
}) {
  const { customerId: defaultCustomerId, vehicleId: defaultVehicleId } = await searchParams
  const { tenantId } = await requireAuth()

  const [customers, cannedJobs, tenant] = await Promise.all([
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
    getCannedJobs({ activeOnly: true }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { laborRate: true, taxRate: true } }),
  ])

  const customerVehicles = Object.fromEntries(customers.map((c) => [c.id, c.vehicles]))

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/estimates" />}>
          <ChevronLeft className="h-4 w-4" />
          Estimates
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">New Estimate</h1>
      </div>

      <EstimateFormShell
        action={createEstimate}
        submitLabel="Create Estimate"
        cancelSlot={
          <Button type="button" variant="outline" render={<Link href="/estimates" />}>
            Cancel
          </Button>
        }
      >
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

        {/* Line Items */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-medium mb-4">Line Items</h2>
          <LineItemEditor
            cannedJobs={cannedJobs}
            laborRate={tenant?.laborRate?.toNumber() ?? 0}
            taxRate={tenant?.taxRate?.toNumber() ?? 0}
          />
        </div>

        {/* Notes */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-medium">Notes</h2>
          <div className="space-y-2">
            <Label htmlFor="notes">Customer-visible notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Notes visible to the customer on the estimate…"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal notes</Label>
            <Textarea
              id="internalNotes"
              name="internalNotes"
              placeholder="Internal notes (not shown to customer)…"
              rows={2}
            />
          </div>
        </div>
      </EstimateFormShell>
    </div>
  )
}
