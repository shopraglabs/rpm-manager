import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PrintButton } from "@/components/ui/print-button"
import { getEstimate } from "@/modules/estimates/queries"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { formatCurrency, formatDate, formatPhone } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Estimate" }

const LINE_TYPE_LABELS: Record<string, string> = {
  LABOR: "Labor",
  PART: "Part",
  SUBLET: "Sublet",
  FEE: "Fee",
  DISCOUNT: "Discount",
}

export default async function EstimatePrintPage({
  params,
}: {
  params: Promise<{ estimateId: string }>
}) {
  const { estimateId } = await params
  const { tenantId } = await requireAuth()

  const [estimate, tenant] = await Promise.all([
    getEstimate(estimateId),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
  ])

  if (!estimate) notFound()

  const vehicleLabel = [
    estimate.vehicle.year,
    estimate.vehicle.make,
    estimate.vehicle.model,
    estimate.vehicle.trim,
  ]
    .filter(Boolean)
    .join(" ")

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
      {/* Toolbar — hidden when printing */}
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
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, color: "#64748b" }}>Preview — {estimate.estimateNumber}</span>
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
            {estimate.estimateNumber}
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
            Estimate
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
            Date: {formatDate(estimate.createdAt)}
          </p>
          {estimate.expiresAt && (
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
              Expires: {formatDate(estimate.expiresAt)}
            </p>
          )}
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 4,
              display: "inline-block",
              background:
                estimate.status === "APPROVED"
                  ? "#dcfce7"
                  : estimate.status === "DECLINED"
                    ? "#fee2e2"
                    : "#f1f5f9",
              color:
                estimate.status === "APPROVED"
                  ? "#16a34a"
                  : estimate.status === "DECLINED"
                    ? "#dc2626"
                    : "#64748b",
            }}
          >
            {estimate.status}
          </p>
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
            {estimate.customer.firstName} {estimate.customer.lastName}
          </p>
          {estimate.customer.phone && (
            <p style={{ margin: "0 0 2px", fontSize: 13, color: "#64748b" }}>
              {formatPhone(estimate.customer.phone)}
            </p>
          )}
          {estimate.customer.email && (
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{estimate.customer.email}</p>
          )}
          {estimate.customer.address && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              {estimate.customer.address}
              {estimate.customer.city
                ? `, ${estimate.customer.city}${estimate.customer.state ? `, ${estimate.customer.state}` : ""}`
                : ""}
            </p>
          )}
        </div>

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
          <p style={{ margin: "0 0 2px", fontWeight: 600 }}>{vehicleLabel || "—"}</p>
          {estimate.vehicle.licensePlate && (
            <p
              style={{ margin: "0 0 2px", fontSize: 13, color: "#64748b", fontFamily: "monospace" }}
            >
              {estimate.vehicle.licensePlate}
            </p>
          )}
          {estimate.vehicle.vin && (
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>
              VIN: {estimate.vehicle.vin}
            </p>
          )}
          {estimate.vehicle.mileage && (
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
              Mileage: {estimate.vehicle.mileage.toLocaleString()} mi
            </p>
          )}
        </div>
      </div>

      {/* Line items */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#1d4ed8" }}>
            <th
              style={{
                textAlign: "left",
                padding: "8px 12px",
                color: "white",
                fontWeight: 600,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Description
            </th>
            <th
              style={{
                textAlign: "center",
                padding: "8px 12px",
                color: "white",
                fontWeight: 600,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                width: 60,
              }}
            >
              Type
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "8px 12px",
                color: "white",
                fontWeight: 600,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                width: 60,
              }}
            >
              Qty
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "8px 12px",
                color: "white",
                fontWeight: 600,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                width: 90,
              }}
            >
              Unit Price
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "8px 12px",
                color: "white",
                fontWeight: 600,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                width: 90,
              }}
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {estimate.lineItems.map((item, i) => {
            const lineTotal = item.quantity.toNumber() * item.unitPrice.toNumber()
            const isDiscount = item.type === "DISCOUNT"
            return (
              <tr key={item.id} style={{ background: i % 2 === 0 ? "#f8fafc" : "white" }}>
                <td style={{ padding: "8px 12px", color: "#0f172a" }}>
                  {item.description}
                  {item.partNumber && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        marginLeft: 6,
                        fontFamily: "monospace",
                      }}
                    >
                      #{item.partNumber}
                    </span>
                  )}
                </td>
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

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 28 }}>
        <table style={{ width: 260, fontSize: 13 }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 12px 4px 0", color: "#64748b" }}>Subtotal</td>
              <td style={{ padding: "4px 0", textAlign: "right", fontFamily: "monospace" }}>
                {formatCurrency(estimate.subtotal.toNumber())}
              </td>
            </tr>
            {estimate.taxAmount.toNumber() > 0 && (
              <tr>
                <td style={{ padding: "4px 12px 4px 0", color: "#64748b" }}>Tax</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontFamily: "monospace" }}>
                  {formatCurrency(estimate.taxAmount.toNumber())}
                </td>
              </tr>
            )}
            <tr>
              <td
                colSpan={2}
                style={{
                  padding: "8px 0 0",
                  borderTop: "2px solid #0f172a",
                }}
              />
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
                {formatCurrency(estimate.total.toNumber())}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {estimate.notes && (
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
            {estimate.notes}
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
          alignItems: "flex-end",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Thank you for your business!</p>
          {tenant?.phone && (
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
              {formatPhone(tenant.phone)}
              {tenant?.email ? ` · ${tenant.email}` : ""}
            </p>
          )}
        </div>

        {/* Signature line */}
        <div style={{ textAlign: "right" }}>
          <div style={{ borderBottom: "1px solid #cbd5e1", width: 200, marginBottom: 4 }} />
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Customer Signature</p>
        </div>
      </div>
    </div>
  )
}
