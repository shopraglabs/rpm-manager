import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { LineItemEditor } from "@/components/estimates/line-item-editor"
import { EstimateFormShell } from "@/components/estimates/estimate-form-shell"
import { createInvoice, createInvoiceFromWorkOrder } from "@/modules/invoices/actions"
import { getCannedJobs } from "@/modules/canned-jobs/queries"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export const metadata: Metadata = { title: "New Invoice" }

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ workOrderId?: string; customerId?: string }>
}) {
  const { workOrderId, customerId: defaultCustomerId } = await searchParams
  const { tenantId } = await requireAuth()

  // If coming from a work order, create directly and redirect
  if (workOrderId) {
    const wo = await prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId },
      include: { lineItems: true },
    })
    if (!wo) notFound()

    // Check if invoice already exists
    const existing = await prisma.invoice.findFirst({ where: { workOrderId } })
    if (existing) {
      // Already exists — redirect to it (handled server-side)
    }

    const createFromWO = createInvoiceFromWorkOrder.bind(null, workOrderId)

    return (
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" render={<Link href={`/work-orders/${workOrderId}`} />}>
            <ChevronLeft className="h-4 w-4" />
            Work Order {wo.orderNumber}
          </Button>
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Invoice will be pre-populated from work order {wo.orderNumber}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            This will create an invoice copying all {wo.lineItems.length} line item
            {wo.lineItems.length !== 1 ? "s" : ""} from the work order.
          </p>
          <form
            action={async () => {
              await createFromWO()
            }}
          >
            <Button type="submit">Create Invoice from Work Order</Button>
          </form>
        </div>
      </div>
    )
  }

  // Manual invoice creation
  const [customers, cannedJobs] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
    getCannedJobs({ activeOnly: true }),
  ])

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/invoices" />}>
          <ChevronLeft className="h-4 w-4" />
          Invoices
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">New Invoice</h1>
      </div>

      <EstimateFormShell
        action={createInvoice}
        submitLabel="Create Invoice"
        cancelSlot={
          <Button type="button" variant="outline" render={<Link href="/invoices" />}>
            Cancel
          </Button>
        }
      >
        {/* Customer */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-medium mb-4">Customer</h2>
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer *</Label>
            <select
              id="customerId"
              name="customerId"
              required
              defaultValue={defaultCustomerId ?? ""}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-medium mb-4">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax rate (%)</Label>
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                defaultValue="0"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-medium mb-4">Line Items</h2>
          <LineItemEditor cannedJobs={cannedJobs} />
        </div>

        {/* Notes */}
        <div className="rounded-xl border bg-card p-6 space-y-2">
          <h2 className="font-medium mb-2">Notes</h2>
          <Label htmlFor="notes">Customer-visible notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Payment terms, thank you message…"
            rows={3}
          />
        </div>
      </EstimateFormShell>
    </div>
  )
}
