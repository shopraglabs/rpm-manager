import { notFound } from "next/navigation"
import { PrintButton } from "@/components/ui/print-button"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils/format"

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIALLY_PAID: "Partial",
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

export default async function CustomerStatementPage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  const { customerId } = await params
  const { tenantId } = await requireAuth()

  const customerQuery = prisma.customer.findFirst({
    where: { id: customerId, tenantId },
    include: {
      invoices: {
        where: { status: { not: "VOID" } },
        orderBy: { createdAt: "asc" },
        include: {
          payments: { orderBy: { createdAt: "asc" } },
          workOrder: {
            select: {
              orderNumber: true,
              vehicle: { select: { year: true, make: true, model: true } },
            },
          },
        },
      },
    },
  })

  const tenantQuery = prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  })

  const [customer, tenant] = await Promise.all([customerQuery, tenantQuery])

  if (!customer) notFound()

  type CustomerWithInvoices = NonNullable<Awaited<typeof customerQuery>>
  const typedCustomer = customer as CustomerWithInvoices

  const totalBilled = typedCustomer.invoices.reduce((sum, inv) => sum + inv.total.toNumber(), 0)
  const totalPaid = typedCustomer.invoices.reduce(
    (sum, inv) => sum + (inv.total.toNumber() - inv.amountDue.toNumber()),
    0
  )
  const totalDue = typedCustomer.invoices.reduce((sum, inv) => sum + inv.amountDue.toNumber(), 0)

  const statementDate = new Date()

  return (
    <>
      {/* Toolbar */}
      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 24px",
          borderBottom: "1px solid #e2e8f0",
          background: "#f8fafc",
        }}
      >
        <a
          href={`/customers/${customerId}`}
          style={{ fontSize: "13px", color: "#64748b", textDecoration: "none" }}
        >
          ← Back to Customer
        </a>
        <PrintButton />
      </div>

      {/* Statement Document */}
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "40px 48px",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontSize: "13px",
          color: "#1e293b",
          lineHeight: "1.5",
        }}
      >
        {/* Shop Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "28px",
          }}
        >
          <div>
            <p style={{ fontWeight: 700, fontSize: "18px", margin: 0 }}>{tenant?.name}</p>
            {tenant?.address && (
              <p style={{ color: "#64748b", margin: "4px 0 0" }}>
                {tenant.address}
                {tenant.city && `, ${tenant.city}`}
                {tenant.state && `, ${tenant.state}`}
                {tenant.zip && ` ${tenant.zip}`}
              </p>
            )}
            {tenant?.phone && (
              <p style={{ color: "#64748b", margin: "2px 0 0" }}>{tenant.phone}</p>
            )}
            {tenant?.email && (
              <p style={{ color: "#64748b", margin: "2px 0 0" }}>{tenant.email}</p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontWeight: 700,
                fontSize: "20px",
                margin: 0,
                color: "#1d4ed8",
              }}
            >
              ACCOUNT STATEMENT
            </p>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "12px" }}>
              Statement Date: {formatDate(statementDate)}
            </p>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "2px solid #1d4ed8", marginBottom: "24px" }} />

        {/* Customer Info */}
        <div style={{ marginBottom: "28px" }}>
          <p
            style={{
              textTransform: "uppercase",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "#64748b",
              marginBottom: "8px",
            }}
          >
            Statement For
          </p>
          <p style={{ fontWeight: 600, fontSize: "15px", margin: "0 0 2px" }}>
            {customer.firstName} {customer.lastName}
          </p>
          {customer.address && (
            <p style={{ color: "#64748b", margin: "2px 0" }}>
              {customer.address}
              {customer.city && `, ${customer.city}`}
              {customer.state && `, ${customer.state}`}
              {customer.zip && ` ${customer.zip}`}
            </p>
          )}
          {customer.email && (
            <p style={{ color: "#64748b", margin: "2px 0" }}>{customer.email}</p>
          )}
          {customer.phone && (
            <p style={{ color: "#64748b", margin: "2px 0" }}>{customer.phone}</p>
          )}
        </div>

        {/* Summary Box */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "28px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px" }}>Total Billed</p>
            <p style={{ fontWeight: 700, fontSize: "18px", fontFamily: "monospace", margin: 0 }}>
              {formatCurrency(totalBilled)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px" }}>Total Paid</p>
            <p
              style={{
                fontWeight: 700,
                fontSize: "18px",
                fontFamily: "monospace",
                margin: 0,
                color: "#16a34a",
              }}
            >
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px" }}>Balance Due</p>
            <p
              style={{
                fontWeight: 700,
                fontSize: "18px",
                fontFamily: "monospace",
                margin: 0,
                color: totalDue > 0 ? "#dc2626" : "#1e293b",
              }}
            >
              {formatCurrency(totalDue)}
            </p>
          </div>
        </div>

        {/* Invoice list */}
        {typedCustomer.invoices.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}>
            No invoices on file.
          </p>
        ) : (
          typedCustomer.invoices.map((invoice) => {
            const vehicleLabel = invoice.workOrder
              ? [
                  invoice.workOrder.vehicle.year,
                  invoice.workOrder.vehicle.make,
                  invoice.workOrder.vehicle.model,
                ]
                  .filter(Boolean)
                  .join(" ")
              : null

            const amountPaid = invoice.total.toNumber() - invoice.amountDue.toNumber()
            const isOverdue = invoice.status === "OVERDUE"
            const isPaid = invoice.status === "PAID"

            return (
              <div
                key={invoice.id}
                style={{
                  marginBottom: "24px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {/* Invoice header */}
                <div
                  style={{
                    background: isOverdue ? "#fef2f2" : isPaid ? "#f0fdf4" : "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    padding: "10px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontFamily: "monospace",
                        fontSize: "13px",
                      }}
                    >
                      {invoice.invoiceNumber}
                    </span>
                    {invoice.workOrder && (
                      <span style={{ color: "#64748b", marginLeft: "8px", fontSize: "12px" }}>
                        · {invoice.workOrder.orderNumber}
                        {vehicleLabel && ` · ${vehicleLabel}`}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: isOverdue
                          ? "#fee2e2"
                          : isPaid
                            ? "#dcfce7"
                            : "#e2e8f0",
                        color: isOverdue ? "#dc2626" : isPaid ? "#16a34a" : "#64748b",
                      }}
                    >
                      {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                    </span>
                  </div>
                </div>

                {/* Invoice body */}
                <div style={{ padding: "10px 16px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr",
                      gap: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <p style={{ color: "#64748b", margin: "0 0 2px" }}>Date</p>
                      <p style={{ margin: 0, fontWeight: 500 }}>{formatDate(invoice.createdAt)}</p>
                    </div>
                    <div>
                      <p style={{ color: "#64748b", margin: "0 0 2px" }}>Invoice Total</p>
                      <p style={{ margin: 0, fontWeight: 500, fontFamily: "monospace" }}>
                        {formatCurrency(invoice.total.toNumber())}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#64748b", margin: "0 0 2px" }}>Paid</p>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 500,
                          fontFamily: "monospace",
                          color: "#16a34a",
                        }}
                      >
                        {formatCurrency(amountPaid)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#64748b", margin: "0 0 2px" }}>Balance</p>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontFamily: "monospace",
                          color: invoice.amountDue.toNumber() > 0 ? "#dc2626" : "#1e293b",
                        }}
                      >
                        {formatCurrency(invoice.amountDue.toNumber())}
                      </p>
                    </div>
                  </div>

                  {/* Payments */}
                  {invoice.payments.length > 0 && (
                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                      {invoice.payments.map((pmt) => (
                        <div
                          key={pmt.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "11px",
                            color: "#64748b",
                            padding: "2px 0",
                          }}
                        >
                          <span>
                            Payment · {PAYMENT_METHOD_LABELS[pmt.method] ?? pmt.method}
                            {pmt.reference && ` #${pmt.reference}`}
                          </span>
                          <span style={{ fontFamily: "monospace", color: "#16a34a" }}>
                            {formatDate(pmt.createdAt)} · {formatCurrency(pmt.amount.toNumber())}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "11px",
            marginTop: "40px",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "20px",
          }}
        >
          {tenant?.name} · Statement for {customer.firstName} {customer.lastName} ·{" "}
          {formatDate(statementDate)}
        </p>
      </div>
    </>
  )
}
