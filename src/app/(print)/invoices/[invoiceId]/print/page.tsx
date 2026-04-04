import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PrintButton } from "@/components/ui/print-button"
import { getInvoice } from "@/modules/invoices/queries"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { formatCurrency, formatDate, formatPhone } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Invoice" }

const LINE_TYPE_LABELS: Record<string, string> = {
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

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>
}) {
  const { invoiceId } = await params
  const { tenantId } = await requireAuth()

  const [invoice, tenant] = await Promise.all([
    getInvoice(invoiceId),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
  ])

  if (!invoice) notFound()

  const isPaid = invoice.status === "PAID"
  const vehicleLabel = invoice.workOrder?.vehicle
    ? [
        invoice.workOrder.vehicle.year,
        invoice.workOrder.vehicle.make,
        invoice.workOrder.vehicle.model,
      ]
        .filter(Boolean)
        .join(" ")
    : null

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "32px 24px",
        background: "white",
        minHeight: "100vh",
      }}
    >
      {/* Toolbar */}
      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          padding: "12px 16px",
          background: "#f1f5f9",
          borderRadius: 8,
        }}
      >
        <span style={{ fontSize: 13, color: "#64748b" }}>Preview — {invoice.invoiceNumber}</span>
        <PrintButton />
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: "2px solid #1d4ed8",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#1d4ed8" }}>
            {tenant?.name ?? "Your Shop"}
          </h1>
          {tenant?.address && (
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{tenant.address}</p>
          )}
          {(tenant?.city || tenant?.state) && (
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              {[tenant?.city, tenant?.state, tenant?.zip].filter(Boolean).join(", ")}
            </p>
          )}
          {tenant?.phone && (
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
              {formatPhone(tenant.phone)}
            </p>
          )}
          {tenant?.email && (
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{tenant.email}</p>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <p
            style={{
              margin: "0 0 2px",
              fontSize: 20,
              fontWeight: 700,
              color: "#0f172a",
              fontFamily: "monospace",
            }}
          >
            {invoice.invoiceNumber}
          </p>
          <p
            style={{
              margin: "0 0 2px",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#94a3b8",
            }}
          >
            Invoice
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
            Date: {formatDate(invoice.createdAt)}
          </p>
          {invoice.dueDate && (
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
              Due: {formatDate(invoice.dueDate)}
            </p>
          )}
          {invoice.workOrder && (
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
              WO: {invoice.workOrder.orderNumber}
            </p>
          )}
          {isPaid && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                fontWeight: 700,
                color: "#16a34a",
                padding: "3px 10px",
                background: "#dcfce7",
                borderRadius: 4,
                display: "inline-block",
              }}
            >
              PAID
            </p>
          )}
        </div>
      </div>

      {/* Bill to / Vehicle */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
        <div>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#94a3b8",
            }}
          >
            Bill To
          </p>
          <p style={{ margin: "0 0 2px", fontWeight: 600 }}>
            {invoice.customer.firstName} {invoice.customer.lastName}
          </p>
          {invoice.customer.phone && (
            <p style={{ margin: "0 0 2px", fontSize: 13, color: "#64748b" }}>
              {formatPhone(invoice.customer.phone)}
            </p>
          )}
          {invoice.customer.email && (
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{invoice.customer.email}</p>
          )}
          {invoice.customer.address && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              {invoice.customer.address}
              {invoice.customer.city
                ? `, ${invoice.customer.city}${invoice.customer.state ? `, ${invoice.customer.state}` : ""}`
                : ""}
            </p>
          )}
        </div>

        {vehicleLabel && (
          <div>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#94a3b8",
              }}
            >
              Vehicle
            </p>
            <p style={{ margin: 0, fontWeight: 600 }}>{vehicleLabel}</p>
          </div>
        )}
      </div>

      {/* Line items */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#1d4ed8" }}>
            {["Description", "Type", "Qty", "Unit Price", "Total"].map((h, i) => (
              <th
                key={h}
                style={{
                  textAlign: i === 0 ? "left" : i <= 2 ? "center" : "right",
                  padding: "8px 12px",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  width: i === 0 ? "auto" : i === 1 ? 60 : i === 2 ? 50 : 90,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item, i) => {
            const lineTotal = item.quantity.toNumber() * item.unitPrice.toNumber()
            const isDiscount = item.type === "DISCOUNT"
            return (
              <tr key={item.id} style={{ background: i % 2 === 0 ? "#f8fafc" : "white" }}>
                <td style={{ padding: "8px 12px" }}>{item.description}</td>
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: 11,
                  }}
                >
                  {LINE_TYPE_LABELS[item.type] ?? item.type}
                </td>
                <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "monospace" }}>
                  {item.quantity.toNumber()}
                </td>
                <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "monospace" }}>
                  {formatCurrency(item.unitPrice.toNumber())}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "right",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    color: isDiscount ? "#dc2626" : "#0f172a",
                  }}
                >
                  {isDiscount ? "−" : ""}
                  {formatCurrency(Math.abs(lineTotal))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Totals + Payments */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 28 }}>
        <table style={{ width: 280, fontSize: 13 }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 12px 4px 0", color: "#64748b" }}>Subtotal</td>
              <td style={{ padding: "4px 0", textAlign: "right", fontFamily: "monospace" }}>
                {formatCurrency(invoice.subtotal.toNumber())}
              </td>
            </tr>
            {invoice.taxAmount.toNumber() > 0 && (
              <tr>
                <td style={{ padding: "4px 12px 4px 0", color: "#64748b" }}>Tax</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontFamily: "monospace" }}>
                  {formatCurrency(invoice.taxAmount.toNumber())}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={2} style={{ padding: "8px 0 0", borderTop: "2px solid #0f172a" }} />
            </tr>
            <tr>
              <td style={{ padding: "4px 12px 4px 0", fontWeight: 700, fontSize: 15 }}>Total</td>
              <td
                style={{
                  padding: "4px 0",
                  textAlign: "right",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {formatCurrency(invoice.total.toNumber())}
              </td>
            </tr>

            {invoice.payments.length > 0 && (
              <>
                {invoice.payments.map((pmt, i) => (
                  <tr key={i}>
                    <td style={{ padding: "4px 12px 4px 0", color: "#16a34a", fontSize: 12 }}>
                      Payment — {PAYMENT_METHOD_LABELS[pmt.method] ?? pmt.method}
                    </td>
                    <td
                      style={{
                        padding: "4px 0",
                        textAlign: "right",
                        fontFamily: "monospace",
                        color: "#16a34a",
                        fontSize: 12,
                      }}
                    >
                      −{formatCurrency(pmt.amount.toNumber())}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ padding: "6px 0 0", borderTop: "1px solid #e2e8f0" }} />
                </tr>
                <tr>
                  <td style={{ padding: "4px 12px 4px 0", fontWeight: 700 }}>Balance Due</td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: invoice.amountDue.toNumber() > 0 ? "#dc2626" : "#16a34a",
                    }}
                  >
                    {formatCurrency(invoice.amountDue.toNumber())}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div
          style={{
            padding: "14px 16px",
            background: "#f8fafc",
            borderRadius: 6,
            borderLeft: "3px solid #1d4ed8",
            marginBottom: 24,
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#94a3b8",
            }}
          >
            Notes
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#0f172a", whiteSpace: "pre-wrap" }}>
            {invoice.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 40,
          paddingTop: 16,
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
          Thank you for your business!
          {tenant?.phone ? ` · ${formatPhone(tenant.phone)}` : ""}
          {tenant?.email ? ` · ${tenant.email}` : ""}
        </p>
        {!isPaid && (
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#dc2626" }}>
            Balance due: {formatCurrency(invoice.amountDue.toNumber())}
          </p>
        )}
      </div>
    </div>
  )
}
