import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Ban, ChevronLeft, ExternalLink, Printer, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RecordPaymentForm } from "@/components/invoices/record-payment-form"
import { getInvoice } from "@/modules/invoices/queries"
import { sendInvoice, voidInvoice } from "@/modules/invoices/actions"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Invoice" }

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  PARTIALLY_PAID: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  VOID: "bg-muted text-muted-foreground",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CHECK: "Check",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  ACH: "ACH",
  OTHER: "Other",
}

const LINE_ITEM_TYPE_LABELS: Record<string, string> = {
  LABOR: "Labor",
  PART: "Part",
  SUBLET: "Sublet",
  FEE: "Fee",
  DISCOUNT: "Discount",
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>
}) {
  const { invoiceId } = await params
  const invoice = await getInvoice(invoiceId)
  if (!invoice) notFound()

  const isVoid = invoice.status === "VOID"
  const isPaid = invoice.status === "PAID"
  const canSend = !isVoid && invoice.status === "DRAFT"
  const canResend = !isVoid && !isPaid && ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status)
  const canVoid = !isVoid && !isPaid
  const canPayment = !isVoid && !isPaid
  const amountDue = invoice.amountDue.toNumber()

  const sendWithId = sendInvoice.bind(null, invoiceId)
  const voidWithId = voidInvoice.bind(null, invoiceId)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const portalUrl = invoice.shareToken
    ? `${appUrl}/customer-portal/invoices/${invoice.shareToken}`
    : null

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/invoices" />}>
          <ChevronLeft className="h-4 w-4" />
          Invoices
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">
              {invoice.invoiceNumber}
            </h1>
            <Badge variant="outline" className={STATUS_COLORS[invoice.status] ?? ""}>
              {STATUS_LABELS[invoice.status] ?? invoice.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {invoice.customer.firstName} {invoice.customer.lastName}
            {invoice.workOrder && (
              <>
                {" "}
                ·{" "}
                <Link
                  href={`/work-orders/${invoice.workOrder.id}`}
                  className="hover:underline font-mono"
                >
                  {invoice.workOrder.orderNumber}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/invoices/${invoiceId}/print`} target="_blank" />}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {portalUrl && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={portalUrl} target="_blank" />}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Portal
            </Button>
          )}
          {canSend && (
            <form
              action={async () => {
                await sendWithId()
              }}
            >
              <Button type="submit" variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </form>
          )}
          {canResend && (
            <form
              action={async () => {
                await sendWithId()
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Resend
              </Button>
            </form>
          )}
          {canVoid && (
            <form
              action={async () => {
                await voidWithId()
              }}
              onSubmit={(e) => {
                if (!confirm("Void this invoice? This cannot be undone.")) e.preventDefault()
              }}
            >
              <Button type="submit" variant="destructive" size="sm">
                <Ban className="h-4 w-4 mr-1.5" />
                Void
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary card */}
          <div className="rounded-xl border bg-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold text-base mt-0.5 tabular-nums">
                {formatCurrency(invoice.total.toNumber())}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Amount paid</p>
              <p className="font-semibold text-base mt-0.5 tabular-nums text-green-600">
                {formatCurrency(invoice.amountPaid.toNumber())}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Balance due</p>
              <p
                className={`font-semibold text-base mt-0.5 tabular-nums ${amountDue > 0 ? "text-destructive" : "text-muted-foreground"}`}
              >
                {amountDue > 0 ? formatCurrency(amountDue) : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Due date</p>
              <p className="font-medium mt-0.5">
                {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
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
                  <th className="text-left px-5 py-2.5 font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground hidden md:table-cell">
                    Type
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Qty</th>
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                    Unit price
                  </th>
                  <th className="text-right px-5 py-2.5 font-medium text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3">{item.description}</td>
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
                      {item.type === "DISCOUNT" ? (
                        <span className="text-destructive">
                          -{formatCurrency(item.total.toNumber())}
                        </span>
                      ) : (
                        formatCurrency(item.total.toNumber())
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Totals */}
            <div className="px-5 py-4 border-t bg-muted/20 space-y-1 text-sm">
              <div className="flex justify-between max-w-xs ml-auto">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(invoice.subtotal.toNumber())}
                </span>
              </div>
              {invoice.taxAmount.toNumber() > 0 && (
                <div className="flex justify-between max-w-xs ml-auto">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(invoice.taxAmount.toNumber())}
                  </span>
                </div>
              )}
              <div className="flex justify-between max-w-xs ml-auto text-base font-semibold pt-1 border-t">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(invoice.total.toNumber())}</span>
              </div>
            </div>
          </div>

          {/* Payment history */}
          {invoice.payments.length > 0 && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h2 className="font-medium">Payments</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">
                      Method
                    </th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground hidden md:table-cell">
                      Reference
                    </th>
                    <th className="text-right px-5 py-2.5 font-medium text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.payments.map((pmt) => (
                    <tr key={pmt.id}>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDateTime(pmt.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        {PAYMENT_METHOD_LABELS[pmt.method] ?? pmt.method}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">
                        {pmt.reference ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums text-green-600">
                        {formatCurrency(pmt.amount.toNumber())}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="rounded-xl border bg-card p-5 text-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
              <p className="whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Share link */}
          {invoice.shareToken && (
            <div className="rounded-xl border bg-card p-5 text-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Customer link
              </p>
              <code className="block font-mono text-xs bg-muted px-3 py-2 rounded break-all">
                {`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/customer-portal/invoices/${invoice.shareToken}`}
              </code>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {canPayment && amountDue > 0 && (
            <RecordPaymentForm invoiceId={invoiceId} amountDue={amountDue} />
          )}

          {isPaid && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-700 text-center">
              <p className="font-semibold">Paid in full</p>
              {invoice.paidAt && (
                <p className="text-xs mt-1 text-green-600">{formatDate(invoice.paidAt)}</p>
              )}
            </div>
          )}

          {isVoid && (
            <div className="rounded-xl border bg-muted p-5 text-sm text-muted-foreground text-center">
              <p className="font-medium">Invoice voided</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
