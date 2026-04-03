import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getEstimate } from "@/modules/estimates/queries"
import { sendEstimate } from "@/modules/estimates/actions"
import { formatCurrency, formatDate } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Estimate" }

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  VIEWED: "bg-blue-50 text-blue-600 border-blue-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  DECLINED: "bg-red-50 text-red-700 border-red-200",
  EXPIRED: "bg-orange-50 text-orange-700 border-orange-200",
  CONVERTED: "bg-purple-50 text-purple-700 border-purple-200",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  APPROVED: "Approved",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CONVERTED: "Converted",
}

const LINE_ITEM_TYPE_LABELS: Record<string, string> = {
  LABOR: "Labor",
  PART: "Part",
  SUBLET: "Sublet",
  FEE: "Fee",
  DISCOUNT: "Discount",
}

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ estimateId: string }>
}) {
  const { estimateId } = await params
  const estimate = await getEstimate(estimateId)
  if (!estimate) notFound()

  const canEdit = !["CONVERTED"].includes(estimate.status)
  const canSend = ["DRAFT", "DECLINED"].includes(estimate.status)

  const sendWithId = sendEstimate.bind(null, estimateId)

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/estimates" />}>
          <ChevronLeft className="h-4 w-4" />
          Estimates
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">
              {estimate.estimateNumber}
            </h1>
            <Badge variant="outline" className={STATUS_COLORS[estimate.status] ?? ""}>
              {STATUS_LABELS[estimate.status] ?? estimate.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {estimate.customer.firstName} {estimate.customer.lastName} ·{" "}
            {estimate.vehicle.year ? `${estimate.vehicle.year} ` : ""}{estimate.vehicle.make} {estimate.vehicle.model}
          </p>
        </div>
        <div className="flex gap-2">
          {canSend && (
            <form action={async () => { await sendWithId() }}>
              <Button type="submit" variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Send to Customer
              </Button>
            </form>
          )}
          {canEdit && (
            <Button render={<Link href={`/estimates/${estimateId}/edit`} />}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Info card */}
        <div className="rounded-xl border bg-card p-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Customer</p>
            <p className="font-medium mt-0.5">
              <Link href={`/customers/${estimate.customer.id}`} className="hover:underline">
                {estimate.customer.firstName} {estimate.customer.lastName}
              </Link>
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Vehicle</p>
            <p className="font-medium mt-0.5">
              <Link href={`/vehicles/${estimate.vehicle.id}`} className="hover:underline">
                {estimate.vehicle.year ? `${estimate.vehicle.year} ` : ""}{estimate.vehicle.make} {estimate.vehicle.model}
              </Link>
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium mt-0.5">{formatDate(estimate.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Created by</p>
            <p className="font-medium mt-0.5">
              {estimate.createdBy.firstName} {estimate.createdBy.lastName}
            </p>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-medium">Line Items</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Qty</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Unit price</th>
                <th className="text-right px-5 py-2.5 font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {estimate.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3">
                    <p>{item.description}</p>
                    {item.partNumber && (
                      <p className="text-xs text-muted-foreground font-mono">{item.partNumber}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground hidden md:table-cell">
                    {LINE_ITEM_TYPE_LABELS[item.type] ?? item.type}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {item.quantity.toString()}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {item.type === "DISCOUNT"
                      ? `-${formatCurrency(item.unitPrice.toNumber())}`
                      : formatCurrency(item.unitPrice.toNumber())}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium">
                    {item.type === "DISCOUNT"
                      ? <span className="text-destructive">-{formatCurrency(item.total.toNumber())}</span>
                      : formatCurrency(item.total.toNumber())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="px-5 py-4 border-t bg-muted/20 space-y-1.5 text-sm">
            <div className="flex justify-between max-w-xs ml-auto">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">{formatCurrency(estimate.subtotal.toNumber())}</span>
            </div>
            {estimate.taxAmount.toNumber() > 0 && (
              <div className="flex justify-between max-w-xs ml-auto">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium tabular-nums">{formatCurrency(estimate.taxAmount.toNumber())}</span>
              </div>
            )}
            <div className="flex justify-between max-w-xs ml-auto text-base font-semibold pt-1 border-t">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(estimate.total.toNumber())}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(estimate.notes || estimate.internalNotes) && (
          <div className="rounded-xl border bg-card p-5 space-y-4 text-sm">
            {estimate.notes && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Customer notes</p>
                <p className="whitespace-pre-wrap">{estimate.notes}</p>
              </div>
            )}
            {estimate.internalNotes && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Internal notes</p>
                <p className="whitespace-pre-wrap">{estimate.internalNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Share link if sent */}
        {estimate.shareToken && (
          <div className="rounded-xl border bg-card p-5 text-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Customer link</p>
            <code className="block font-mono text-xs bg-muted px-3 py-2 rounded break-all">
              {`/estimate/${estimate.shareToken}`}
            </code>
          </div>
        )}
      </div>
    </div>
  )
}
