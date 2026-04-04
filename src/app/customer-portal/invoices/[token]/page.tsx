import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { getInvoiceByToken } from "@/modules/invoices/queries"
import { StripePayButton } from "@/components/invoices/stripe-pay-button"
import { prisma } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Invoice" }

const LINE_ITEM_TYPE_LABELS: Record<string, string> = {
  LABOR: "Labor",
  PART: "Part",
  SUBLET: "Sublet",
  FEE: "Fee",
  DISCOUNT: "Discount",
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CHECK: "Check",
  CREDIT_CARD: "Credit card",
  DEBIT_CARD: "Debit card",
  ACH: "ACH",
  OTHER: "Other",
}

export default async function CustomerInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ payment?: string }>
}) {
  const { token } = await params
  const { payment } = await searchParams
  const invoice = await getInvoiceByToken(token)
  if (!invoice) notFound()

  // Load shop info
  const tenant = await prisma.tenant.findUnique({
    where: { id: invoice.tenantId },
    select: {
      name: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      stripeAccountId: true,
    },
  })

  const isPaid = invoice.status === "PAID"
  const amountDue = invoice.amountDue.toNumber()
  const canPayOnline = !isPaid && amountDue > 0 && !!tenant?.stripeAccountId
  const isOverdue =
    invoice.status === "OVERDUE" ||
    (invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.amountDue.toNumber() > 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <h1 className="text-lg font-semibold">{tenant?.name ?? "Invoice"}</h1>
          {(tenant?.phone || tenant?.email) && (
            <p className="text-sm text-muted-foreground">
              {[tenant?.phone, tenant?.email].filter(Boolean).join(" · ")}
            </p>
          )}
          {(tenant?.address || tenant?.city) && (
            <p className="text-sm text-muted-foreground">
              {[tenant?.address, tenant?.city, tenant?.state, tenant?.zip]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Payment outcome banners from Stripe redirect */}
        {payment === "success" && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="font-medium text-green-800">Payment submitted!</p>
              <p className="text-sm text-green-700">
                Your payment is being processed. This page will update shortly.
              </p>
            </div>
          </div>
        )}
        {payment === "cancelled" && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              Payment was cancelled. You can try again below.
            </p>
          </div>
        )}

        {/* Payment status banner */}
        {isPaid && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="font-medium text-green-800">Paid in Full</p>
              {invoice.paidAt && (
                <p className="text-sm text-green-700">
                  Payment received {formatDate(invoice.paidAt)}
                </p>
              )}
            </div>
          </div>
        )}
        {isOverdue && !isPaid && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="font-medium text-red-800">Payment Overdue</p>
              <p className="text-sm text-red-700">Please contact us to arrange payment.</p>
            </div>
          </div>
        )}
        {!isPaid && !isOverdue && invoice.amountDue.toNumber() > 0 && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-medium text-blue-800">Payment Due</p>
              {invoice.dueDate && (
                <p className="text-sm text-blue-700">Due by {formatDate(invoice.dueDate)}</p>
              )}
            </div>
          </div>
        )}

        {/* Invoice info */}
        <div className="rounded-xl border bg-card p-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Customer</p>
            <p className="font-medium">
              {invoice.customer.firstName} {invoice.customer.lastName}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Invoice #</p>
            <p className="font-mono font-medium">{invoice.invoiceNumber}</p>
          </div>
          {invoice.dueDate && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Due date</p>
              <p className="font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
            <p className="font-medium capitalize">
              {invoice.status === "PARTIALLY_PAID"
                ? "Partially Paid"
                : invoice.status.charAt(0) + invoice.status.slice(1).toLowerCase()}
            </p>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-medium">Service Details</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium text-muted-foreground">
                  Description
                </th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">
                  Qty
                </th>
                <th className="text-right px-5 py-2.5 font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoice.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3">
                    <p>{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {LINE_ITEM_TYPE_LABELS[item.type] ?? item.type}
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
              <span className="tabular-nums">{formatCurrency(invoice.subtotal.toNumber())}</span>
            </div>
            {invoice.taxAmount.toNumber() > 0 && (
              <div className="flex justify-between max-w-xs ml-auto">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">{formatCurrency(invoice.taxAmount.toNumber())}</span>
              </div>
            )}
            <div className="flex justify-between max-w-xs ml-auto text-base font-semibold pt-1.5 border-t">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(invoice.total.toNumber())}</span>
            </div>
            {invoice.amountPaid.toNumber() > 0 && (
              <>
                <div className="flex justify-between max-w-xs ml-auto text-green-700">
                  <span>Paid</span>
                  <span className="tabular-nums">
                    −{formatCurrency(invoice.amountPaid.toNumber())}
                  </span>
                </div>
                <div className="flex justify-between max-w-xs ml-auto font-semibold">
                  <span>Balance due</span>
                  <span className="tabular-nums">
                    {formatCurrency(invoice.amountDue.toNumber())}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment history */}
        {invoice.payments.length > 0 && (
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-medium mb-3">Payment History</h2>
            <div className="space-y-2">
              {invoice.payments.map((pmt, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">
                      {PAYMENT_METHOD_LABELS[pmt.method] ?? pmt.method}
                    </span>
                    <span className="text-muted-foreground ml-2">{formatDate(pmt.createdAt)}</span>
                  </div>
                  <span className="tabular-nums font-medium text-green-700">
                    {formatCurrency(pmt.amount.toNumber())}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
            <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Online payment */}
        {canPayOnline && payment !== "success" && (
          <div className="rounded-xl border bg-card p-5">
            <p className="font-medium mb-1">Pay Online</p>
            <p className="text-sm text-muted-foreground mb-4">
              Balance due: {formatCurrency(amountDue)}
            </p>
            <StripePayButton invoiceToken={token} amountDue={amountDue} />
          </div>
        )}

        {/* Contact */}
        {!isPaid && (
          <div className="rounded-xl border bg-card p-5 text-center">
            <p className="text-sm text-muted-foreground">
              To make a payment or if you have questions, please contact{" "}
              <strong>{tenant?.name ?? "us"}</strong>.
              {tenant?.phone && (
                <>
                  {" Call "}
                  <a
                    href={`tel:${tenant.phone}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {tenant.phone}
                  </a>
                </>
              )}
              {tenant?.email && (
                <>
                  {" or email "}
                  <a
                    href={`mailto:${tenant.email}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {tenant.email}
                  </a>
                </>
              )}
              .
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pb-8">
          Thank you for your business.
        </p>
      </main>
    </div>
  )
}
