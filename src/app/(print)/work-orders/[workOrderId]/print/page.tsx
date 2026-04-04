import { notFound } from "next/navigation"
import { PrintButton } from "@/components/ui/print-button"
import { getWorkOrder } from "@/modules/work-orders/queries"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { formatCurrency, formatDate } from "@/lib/utils/format"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  WAITING_PARTS: "Waiting Parts",
  WAITING_APPROVAL: "Waiting Approval",
  QUALITY_CHECK: "Quality Check",
  COMPLETED: "Completed",
  READY_FOR_PICKUP: "Ready for Pickup",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "URGENT",
}

const TYPE_LABELS: Record<string, string> = {
  LABOR: "Labor",
  PART: "Part",
  SUBLET: "Sublet",
  FEE: "Fee",
  DISCOUNT: "Discount",
}

export default async function WorkOrderPrintPage({
  params,
}: {
  params: Promise<{ workOrderId: string }>
}) {
  const { workOrderId } = await params
  const { tenantId } = await requireAuth()

  const [wo, tenant] = await Promise.all([
    getWorkOrder(workOrderId),
    prisma.tenant.findUnique({
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
    }),
  ])
  if (!wo) notFound()

  const vehicleLabel = [wo.vehicle.year, wo.vehicle.make, wo.vehicle.model, wo.vehicle.trim]
    .filter(Boolean)
    .join(" ")

  return (
    <>
      {/* Toolbar (hidden on print) */}
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
          href={`/work-orders/${workOrderId}`}
          style={{ fontSize: "13px", color: "#64748b", textDecoration: "none" }}
        >
          ← Back to Work Order
        </a>
        <PrintButton />
      </div>

      {/* Repair Order Document */}
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
            {tenant?.phone && <p style={{ color: "#64748b", margin: "2px 0 0" }}>{tenant.phone}</p>}
            {tenant?.email && <p style={{ color: "#64748b", margin: "2px 0 0" }}>{tenant.email}</p>}
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontWeight: 700,
                fontSize: "20px",
                margin: 0,
                color: "#1d4ed8",
                fontFamily: "monospace",
              }}
            >
              REPAIR ORDER
            </p>
            <p
              style={{
                fontWeight: 600,
                fontSize: "15px",
                margin: "4px 0 0",
                fontFamily: "monospace",
              }}
            >
              {wo.orderNumber}
            </p>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "12px" }}>
              Date: {formatDate(wo.createdAt)}
            </p>
            <p style={{ color: "#64748b", margin: "2px 0 0", fontSize: "12px" }}>
              Status:{" "}
              <strong style={{ color: "#1e293b" }}>{STATUS_LABELS[wo.status] ?? wo.status}</strong>
            </p>
            <p style={{ color: "#64748b", margin: "2px 0 0", fontSize: "12px" }}>
              Priority:{" "}
              <strong
                style={{
                  color:
                    wo.priority === "URGENT"
                      ? "#dc2626"
                      : wo.priority === "HIGH"
                        ? "#ea580c"
                        : "#1e293b",
                }}
              >
                {PRIORITY_LABELS[wo.priority] ?? wo.priority}
              </strong>
            </p>
          </div>
        </div>

        {/* Divider */}
        <hr style={{ border: "none", borderTop: "2px solid #1d4ed8", marginBottom: "24px" }} />

        {/* Customer & Vehicle */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginBottom: "28px",
          }}
        >
          <div>
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
              Customer
            </p>
            <p style={{ fontWeight: 600, margin: "0 0 4px" }}>
              {wo.customer.firstName} {wo.customer.lastName}
            </p>
          </div>
          <div>
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
              Vehicle
            </p>
            <p style={{ fontWeight: 600, margin: "0 0 2px" }}>{vehicleLabel}</p>
            {wo.vehicle.vin && (
              <p
                style={{
                  color: "#64748b",
                  margin: "2px 0",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              >
                VIN: {wo.vehicle.vin}
              </p>
            )}
            {wo.vehicle.licensePlate && (
              <p style={{ color: "#64748b", margin: "2px 0", fontSize: "11px" }}>
                Plate: {wo.vehicle.licensePlate}
              </p>
            )}
            {wo.mileageIn != null && (
              <p style={{ color: "#64748b", margin: "2px 0", fontSize: "11px" }}>
                Mileage in: {wo.mileageIn.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Assigned Technician */}
        {wo.assignedTo && (
          <div style={{ marginBottom: "24px" }}>
            <p
              style={{
                textTransform: "uppercase",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#64748b",
                marginBottom: "4px",
              }}
            >
              Assigned Technician
            </p>
            <p style={{ fontWeight: 500 }}>
              {wo.assignedTo.firstName} {wo.assignedTo.lastName}
            </p>
          </div>
        )}

        {/* Customer Notes */}
        {wo.notes && (
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              padding: "12px 16px",
              marginBottom: "24px",
              background: "#f8fafc",
            }}
          >
            <p
              style={{
                textTransform: "uppercase",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#64748b",
                marginBottom: "6px",
              }}
            >
              Customer Notes / Complaint
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{wo.notes}</p>
          </div>
        )}

        {/* Line Items */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px" }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Description
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Type
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "8px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Qty
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "8px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Unit Price
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "8px 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {wo.lineItems.map((item, idx) => {
              const total = item.quantity.toNumber() * item.unitPrice.toNumber()
              const isDiscount = item.type === "DISCOUNT"
              return (
                <tr key={item.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <td style={{ padding: "8px 12px", verticalAlign: "top" }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>{item.description}</p>
                    {item.partNumber && (
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "11px",
                          color: "#64748b",
                          fontFamily: "monospace",
                        }}
                      >
                        {item.partNumber}
                      </p>
                    )}
                    {item.laborHours != null && item.laborHours.toNumber() > 0 && (
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                        {item.laborHours.toNumber()}h
                      </p>
                    )}
                  </td>
                  <td style={{ padding: "8px 8px", color: "#64748b", fontSize: "12px" }}>
                    {TYPE_LABELS[item.type] ?? item.type}
                  </td>
                  <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "monospace" }}>
                    {item.quantity.toNumber()}
                  </td>
                  <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "monospace" }}>
                    {isDiscount
                      ? `-${formatCurrency(item.unitPrice.toNumber())}`
                      : formatCurrency(item.unitPrice.toNumber())}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: isDiscount ? "#dc2626" : "#1e293b",
                    }}
                  >
                    {isDiscount ? `-${formatCurrency(Math.abs(total))}` : formatCurrency(total)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "32px",
          }}
        >
          <div style={{ width: "220px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
                fontSize: "13px",
              }}
            >
              <span style={{ color: "#64748b" }}>Subtotal</span>
              <span style={{ fontFamily: "monospace" }}>
                {formatCurrency(wo.subtotal.toNumber())}
              </span>
            </div>
            {wo.taxAmount.toNumber() > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "#64748b" }}>Tax</span>
                <span style={{ fontFamily: "monospace" }}>
                  {formatCurrency(wo.taxAmount.toNumber())}
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderTop: "2px solid #1e293b",
                marginTop: "4px",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span style={{ fontFamily: "monospace" }}>{formatCurrency(wo.total.toNumber())}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {wo.notes && (
          <div style={{ marginBottom: "32px" }}>
            <p
              style={{
                textTransform: "uppercase",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#64748b",
                marginBottom: "6px",
              }}
            >
              Notes
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{wo.notes}</p>
          </div>
        )}

        {/* Signature Lines */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            marginTop: "48px",
            paddingTop: "24px",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <div>
            <div
              style={{ borderBottom: "1px solid #1e293b", marginBottom: "6px", height: "32px" }}
            />
            <p style={{ fontSize: "11px", color: "#64748b" }}>Customer Signature</p>
          </div>
          <div>
            <div
              style={{ borderBottom: "1px solid #1e293b", marginBottom: "6px", height: "32px" }}
            />
            <p style={{ fontSize: "11px", color: "#64748b" }}>Date</p>
          </div>
          <div>
            <div
              style={{ borderBottom: "1px solid #1e293b", marginBottom: "6px", height: "32px" }}
            />
            <p style={{ fontSize: "11px", color: "#64748b" }}>Technician Signature</p>
          </div>
          <div>
            <div
              style={{ borderBottom: "1px solid #1e293b", marginBottom: "6px", height: "32px" }}
            />
            <p style={{ fontSize: "11px", color: "#64748b" }}>Mileage Out</p>
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "11px",
            marginTop: "40px",
          }}
        >
          {tenant?.name} · Repair Order {wo.orderNumber} · Printed {new Date().toLocaleDateString()}
        </p>
      </div>
    </>
  )
}
