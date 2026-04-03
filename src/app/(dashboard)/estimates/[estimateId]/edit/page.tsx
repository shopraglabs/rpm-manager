import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LineItemEditor } from "@/components/estimates/line-item-editor"
import { EstimateFormShell } from "@/components/estimates/estimate-form-shell"
import { getEstimate } from "@/modules/estimates/queries"
import { updateEstimate, deleteEstimate } from "@/modules/estimates/actions"

export const metadata: Metadata = { title: "Edit Estimate" }

export default async function EditEstimatePage({
  params,
}: {
  params: Promise<{ estimateId: string }>
}) {
  const { estimateId } = await params
  const estimate = await getEstimate(estimateId)
  if (!estimate) notFound()
  if (estimate.status === "CONVERTED") redirect(`/estimates/${estimateId}`)

  const updateWithId = updateEstimate.bind(null, estimateId)
  const deleteWithId = deleteEstimate.bind(null, estimateId)

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href={`/estimates/${estimateId}`} />}>
          <ChevronLeft className="h-4 w-4" />
          {estimate.estimateNumber}
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Estimate</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {estimate.customer.firstName} {estimate.customer.lastName} ·{" "}
          {estimate.vehicle.year ? `${estimate.vehicle.year} ` : ""}
          {estimate.vehicle.make} {estimate.vehicle.model}
        </p>
      </div>

      <EstimateFormShell
        action={updateWithId}
        submitLabel="Save Changes"
        cancelSlot={
          <Button type="button" variant="outline" render={<Link href={`/estimates/${estimateId}`} />}>
            Cancel
          </Button>
        }
        deleteSlot={
          <form
            action={async () => { await deleteWithId() }}
            onSubmit={(e) => {
              if (!confirm("Delete this estimate? This cannot be undone.")) {
                e.preventDefault()
              }
            }}
          >
            <Button type="submit" variant="destructive" size="sm">
              Delete Estimate
            </Button>
          </form>
        }
      >
        {/* Customer/Vehicle are fixed on edit */}
        <input type="hidden" name="customerId" value={estimate.customerId} />
        <input type="hidden" name="vehicleId" value={estimate.vehicleId} />

        {/* Line Items */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-medium mb-4">Line Items</h2>
          <LineItemEditor
            defaultItems={estimate.lineItems.map((item) => ({
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
            <Textarea
              id="notes"
              name="notes"
              defaultValue={estimate.notes ?? ""}
              placeholder="Notes visible to the customer on the estimate…"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal notes</Label>
            <Textarea
              id="internalNotes"
              name="internalNotes"
              defaultValue={estimate.internalNotes ?? ""}
              placeholder="Internal notes (not shown to customer)…"
              rows={2}
            />
          </div>
        </div>
      </EstimateFormShell>
    </div>
  )
}
