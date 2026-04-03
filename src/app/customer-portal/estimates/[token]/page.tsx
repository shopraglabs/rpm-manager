import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle } from "lucide-react"
import { getEstimateByToken } from "@/modules/estimates/queries"
import { respondToEstimate } from "@/modules/estimates/actions"
import { prisma } from "@/lib/db"
import { formatCurrency } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Estimate" }

const LINE_ITEM_TYPE_LABELS: Record<string, string> = {
  LABOR: "Labor",
  PART: "Part",
  SUBLET: "Sublet",
  FEE: "Fee",
  DISCOUNT: "Discount",
}

export default async function CustomerEstimatePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const estimate = await getEstimateByToken(token)
  if (!estimate) notFound()

  // Load shop info
  const tenant = await prisma.tenant.findUnique({
    where: { id: estimate.tenantId },
    select: { name: true, phone: true, email: true, address: true, city: true, state: true },
  })

  const isOpen = ["SENT", "VIEWED"].includes(estimate.status)
  const isApproved = estimate.status === "APPROVED"
  const isDeclined = estimate.status === "DECLINED"

  const vehicleLabel = [
    estimate.vehicle.year,
    estimate.vehicle.make,
    estimate.vehicle.model,
    estimate.vehicle.trim,
  ]
    .filter(Boolean)
    .join(" ")

  const approveWithToken = respondToEstimate.bind(null, token, "APPROVED")
  const declineWithToken = respondToEstimate.bind(null, token, "DECLINED")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <h1 className="text-lg font-semibold">{tenant?.name ?? "Service Estimate"}</h1>
          {(tenant?.phone || tenant?.email) && (
            <p className="text-sm text-muted-foreground">
              {[tenant?.phone, tenant?.email].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Status banner */}
        {isApproved && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="font-medium text-green-800">Estimate Approved</p>
              <p className="text-sm text-green-700">Thank you! We&apos;ll be in touch to schedule your service.</p>
            </div>
          </div>
        )}
        {isDeclined && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="font-medium text-red-800">Estimate Declined</p>
              <p className="text-sm text-red-700">You&apos;ve declined this estimate. Contact us if you have questions.</p>
            </div>
          </div>
        )}

        {/* Estimate info */}
        <div className="rounded-xl border bg-card p-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Customer</p>
            <p className="font-medium">{estimate.customer.firstName} {estimate.customer.lastName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Vehicle</p>
            <p className="font-medium">{vehicleLabel || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estimate #</p>
            <p className="font-mono font-medium">{estimate.estimateNumber}</p>
          </div>
          {estimate.expiresAt && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Valid until</p>
              <p className="font-medium">
                {new Date(estimate.expiresAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Line items */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-medium">Service Details</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium text-muted-foreground">Description</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Qty</th>
                <th className="text-right px-5 py-2.5 font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {estimate.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3">
                    <p>{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {LINE_ITEM_TYPE_LABELS[item.type] ?? item.type}
                      {item.partNumber ? ` · ${item.partNumber}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums hidden sm:table-cell">
                    {item.quantity.toString()}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium">
                    {formatCurrency(item.total.toNumber())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="px-5 py-4 border-t bg-muted/20 space-y-1.5 text-sm">
            <div className="flex justify-between max-w-xs ml-auto">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(estimate.subtotal.toNumber())}</span>
            </div>
            {estimate.taxAmount.toNumber() > 0 && (
              <div className="flex justify-between max-w-xs ml-auto">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">{formatCurrency(estimate.taxAmount.toNumber())}</span>
              </div>
            )}
            <div className="flex justify-between max-w-xs ml-auto text-base font-semibold pt-1.5 border-t">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(estimate.total.toNumber())}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {estimate.notes && (
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
            <p className="text-sm whitespace-pre-wrap">{estimate.notes}</p>
          </div>
        )}

        {/* Approve / Decline */}
        {isOpen && (
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-medium mb-1">Your Response</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Please review the estimate above and let us know how you&apos;d like to proceed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <form action={async () => { "use server"; await approveWithToken() }} className="flex-1">
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg px-4 py-3 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Estimate
                </button>
              </form>
              <form action={async () => { "use server"; await declineWithToken() }} className="flex-1">
                <button
                  type="submit"
                  className="w-full bg-muted text-muted-foreground hover:bg-muted/80 font-medium rounded-lg px-4 py-3 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Decline
                </button>
              </form>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pb-8">
          Questions? Contact {tenant?.name ?? "your service advisor"}.
          {tenant?.phone && ` Call us at ${tenant.phone}.`}
        </p>
      </main>
    </div>
  )
}
