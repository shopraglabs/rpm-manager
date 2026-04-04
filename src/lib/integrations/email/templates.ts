/** Shared base layout for all RPM Manager emails */
function layout(shopName: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${shopName}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;border-radius:12px 12px 0 0;padding:24px 32px;">
              <p style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">
                ${shopName}
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;background:#f8fafc;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                This email was sent by ${shopName}. Please do not reply to this address.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export interface EstimateEmailData {
  shopName: string
  shopPhone?: string | null
  shopEmail?: string | null
  customerFirstName: string
  estimateNumber: string
  vehicleLabel: string
  subtotal: string
  total: string
  portalUrl: string
  expiresText?: string
}

export function estimateEmail(data: EstimateEmailData): { subject: string; html: string } {
  const subject = `Estimate ${data.estimateNumber} from ${data.shopName}`

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
      Your Estimate is Ready
    </h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
      Hi ${data.customerFirstName}, here is your estimate for service on your ${data.vehicleLabel}.
    </p>

    <!-- Estimate summary box -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">
            Estimate Number
          </p>
          <p style="margin:0 0 16px;font-size:18px;font-weight:700;font-family:monospace;color:#0f172a;">
            ${data.estimateNumber}
          </p>
          <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">
            Vehicle
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#0f172a;">
            ${data.vehicleLabel}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:14px;color:#64748b;">Subtotal</td>
              <td align="right" style="font-size:14px;color:#0f172a;">${data.subtotal}</td>
            </tr>
            <tr>
              <td colspan="2" style="border-top:1px solid #e2e8f0;padding-top:8px;margin-top:8px;"></td>
            </tr>
            <tr>
              <td style="font-size:16px;font-weight:700;color:#0f172a;padding-top:4px;">Total</td>
              <td align="right" style="font-size:16px;font-weight:700;color:#0f172a;padding-top:4px;">
                ${data.total}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${data.portalUrl}"
            style="display:inline-block;background:#1d4ed8;color:#fff;font-size:15px;font-weight:600;
                   padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.2px;">
            View &amp; Approve Estimate
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">
      Or copy this link: <a href="${data.portalUrl}" style="color:#1d4ed8;">${data.portalUrl}</a>
    </p>

    ${
      data.shopPhone || data.shopEmail
        ? `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="margin:0;font-size:13px;color:#64748b;text-align:center;">
      Questions? Contact us at
      ${data.shopPhone ? `<a href="tel:${data.shopPhone}" style="color:#1d4ed8;">${data.shopPhone}</a>` : ""}
      ${data.shopPhone && data.shopEmail ? " · " : ""}
      ${data.shopEmail ? `<a href="mailto:${data.shopEmail}" style="color:#1d4ed8;">${data.shopEmail}</a>` : ""}
    </p>`
        : ""
    }
  `

  return { subject, html: layout(data.shopName, content) }
}

export interface InvoiceEmailData {
  shopName: string
  shopPhone?: string | null
  shopEmail?: string | null
  customerFirstName: string
  invoiceNumber: string
  total: string
  amountDue: string
  dueDate?: string | null
  portalUrl: string
}

export function invoiceEmail(data: InvoiceEmailData): { subject: string; html: string } {
  const subject = `Invoice ${data.invoiceNumber} from ${data.shopName}`

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
      Your Invoice
    </h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
      Hi ${data.customerFirstName}, thank you for your business! Here is your invoice.
    </p>

    <!-- Invoice summary box -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">
            Invoice Number
          </p>
          <p style="margin:0 0 16px;font-size:18px;font-weight:700;font-family:monospace;color:#0f172a;">
            ${data.invoiceNumber}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:14px;color:#64748b;">Total</td>
              <td align="right" style="font-size:14px;color:#0f172a;">${data.total}</td>
            </tr>
            ${
              data.amountDue !== data.total
                ? `<tr>
              <td style="font-size:14px;color:#64748b;padding-top:4px;">Amount Due</td>
              <td align="right" style="font-size:14px;font-weight:600;color:#dc2626;padding-top:4px;">
                ${data.amountDue}
              </td>
            </tr>`
                : ""
            }
            ${
              data.dueDate
                ? `<tr>
              <td style="font-size:14px;color:#64748b;padding-top:4px;">Due Date</td>
              <td align="right" style="font-size:14px;color:#0f172a;padding-top:4px;">${data.dueDate}</td>
            </tr>`
                : ""
            }
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${data.portalUrl}"
            style="display:inline-block;background:#1d4ed8;color:#fff;font-size:15px;font-weight:600;
                   padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.2px;">
            View Invoice
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">
      Or copy this link: <a href="${data.portalUrl}" style="color:#1d4ed8;">${data.portalUrl}</a>
    </p>

    ${
      data.shopPhone || data.shopEmail
        ? `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="margin:0;font-size:13px;color:#64748b;text-align:center;">
      Questions? Contact us at
      ${data.shopPhone ? `<a href="tel:${data.shopPhone}" style="color:#1d4ed8;">${data.shopPhone}</a>` : ""}
      ${data.shopPhone && data.shopEmail ? " · " : ""}
      ${data.shopEmail ? `<a href="mailto:${data.shopEmail}" style="color:#1d4ed8;">${data.shopEmail}</a>` : ""}
    </p>`
        : ""
    }
  `

  return { subject, html: layout(data.shopName, content) }
}

export interface InspectionEmailData {
  shopName: string
  shopPhone?: string | null
  shopEmail?: string | null
  customerFirstName: string
  vehicleLabel: string
  urgentCount: number
  poorCount: number
  portalUrl: string
}

export function inspectionEmail(data: InspectionEmailData): { subject: string; html: string } {
  const subject = `Vehicle Inspection Report from ${data.shopName}`
  const hasIssues = data.urgentCount > 0 || data.poorCount > 0

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
      Your Vehicle Inspection Report
    </h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
      Hi ${data.customerFirstName}, we've completed a digital inspection of your ${data.vehicleLabel}.
    </p>

    ${
      hasIssues
        ? `<!-- Issues summary -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 24px;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#dc2626;">
            ⚠️ Items Needing Attention
          </p>
          ${data.urgentCount > 0 ? `<p style="margin:0 0 4px;font-size:13px;color:#dc2626;">• ${data.urgentCount} urgent item${data.urgentCount !== 1 ? "s" : ""} (requires immediate attention)</p>` : ""}
          ${data.poorCount > 0 ? `<p style="margin:0;font-size:13px;color:#ea580c;">• ${data.poorCount} poor condition item${data.poorCount !== 1 ? "s" : ""}</p>` : ""}
        </td>
      </tr>
    </table>`
        : `<table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 24px;">
          <p style="margin:0;font-size:14px;color:#16a34a;">
            ✓ Your vehicle passed inspection — everything looks good!
          </p>
        </td>
      </tr>
    </table>`
    }

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${data.portalUrl}"
            style="display:inline-block;background:#1d4ed8;color:#fff;font-size:15px;font-weight:600;
                   padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.2px;">
            View Full Inspection Report
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">
      Or copy this link: <a href="${data.portalUrl}" style="color:#1d4ed8;">${data.portalUrl}</a>
    </p>

    ${
      data.shopPhone || data.shopEmail
        ? `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="margin:0;font-size:13px;color:#64748b;text-align:center;">
      Questions? Contact us at
      ${data.shopPhone ? `<a href="tel:${data.shopPhone}" style="color:#1d4ed8;">${data.shopPhone}</a>` : ""}
      ${data.shopPhone && data.shopEmail ? " · " : ""}
      ${data.shopEmail ? `<a href="mailto:${data.shopEmail}" style="color:#1d4ed8;">${data.shopEmail}</a>` : ""}
    </p>`
        : ""
    }
  `

  return { subject, html: layout(data.shopName, content) }
}

// ============================================================
// OVERDUE INVOICE REMINDER
// ============================================================

export interface OverdueInvoiceEmailData {
  shopName: string
  shopPhone?: string | null
  shopEmail?: string | null
  customerFirstName: string
  invoiceNumber: string
  amountDue: string
  dueDate: string
  portalUrl: string
}

export function overdueInvoiceEmail(data: OverdueInvoiceEmailData): {
  subject: string
  html: string
} {
  const subject = `Friendly reminder: Invoice ${data.invoiceNumber} is past due`

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
      Payment Reminder
    </h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
      Hi ${data.customerFirstName}, this is a friendly reminder that your invoice from ${data.shopName}
      is past due. Please use the button below to view and pay your balance.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">
            Invoice Number
          </p>
          <p style="margin:0 0 16px;font-size:18px;font-weight:700;font-family:monospace;color:#0f172a;">
            ${data.invoiceNumber}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:14px;color:#64748b;">Amount Due</td>
              <td align="right" style="font-size:14px;font-weight:700;color:#dc2626;">${data.amountDue}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#64748b;padding-top:4px;">Due Date</td>
              <td align="right" style="font-size:14px;color:#dc2626;padding-top:4px;">${data.dueDate}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${data.portalUrl}"
            style="display:inline-block;background:#dc2626;color:#fff;font-size:15px;font-weight:600;
                   padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.2px;">
            Pay Now
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">
      Or copy this link: <a href="${data.portalUrl}" style="color:#1d4ed8;">${data.portalUrl}</a>
    </p>

    ${
      data.shopPhone || data.shopEmail
        ? `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="margin:0;font-size:13px;color:#64748b;text-align:center;">
      Questions? Contact us at
      ${data.shopPhone ? `<a href="tel:${data.shopPhone}" style="color:#1d4ed8;">${data.shopPhone}</a>` : ""}
      ${data.shopPhone && data.shopEmail ? " · " : ""}
      ${data.shopEmail ? `<a href="mailto:${data.shopEmail}" style="color:#1d4ed8;">${data.shopEmail}</a>` : ""}
    </p>`
        : ""
    }
  `

  return { subject, html: layout(data.shopName, content) }
}

// ============================================================
// APPOINTMENT REMINDER
// ============================================================

export interface AppointmentReminderEmailData {
  shopName: string
  shopPhone?: string | null
  shopEmail?: string | null
  shopAddress?: string | null
  customerFirstName: string
  appointmentTitle: string
  appointmentDate: string
  appointmentTime: string
  vehicleLabel?: string | null
  description?: string | null
}

export function appointmentReminderEmail(data: AppointmentReminderEmailData): {
  subject: string
  html: string
} {
  const subject = `Appointment reminder: ${data.appointmentTitle} tomorrow at ${data.appointmentTime}`

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
      Appointment Reminder
    </h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
      Hi ${data.customerFirstName}, this is a reminder about your upcoming appointment
      at ${data.shopName} tomorrow.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">
            Service
          </p>
          <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#0f172a;">
            ${data.appointmentTitle}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:14px;color:#64748b;">Date</td>
              <td align="right" style="font-size:14px;color:#0f172a;">${data.appointmentDate}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#64748b;padding-top:4px;">Time</td>
              <td align="right" style="font-size:14px;font-weight:600;color:#1d4ed8;padding-top:4px;">${data.appointmentTime}</td>
            </tr>
            ${
              data.vehicleLabel
                ? `<tr>
              <td style="font-size:14px;color:#64748b;padding-top:4px;">Vehicle</td>
              <td align="right" style="font-size:14px;color:#0f172a;padding-top:4px;">${data.vehicleLabel}</td>
            </tr>`
                : ""
            }
            ${
              data.shopAddress
                ? `<tr>
              <td style="font-size:14px;color:#64748b;padding-top:4px;">Location</td>
              <td align="right" style="font-size:14px;color:#0f172a;padding-top:4px;">${data.shopAddress}</td>
            </tr>`
                : ""
            }
          </table>
          ${
            data.description
              ? `<p style="margin:16px 0 0;font-size:13px;color:#64748b;border-top:1px solid #bfdbfe;padding-top:12px;">
            ${data.description}
          </p>`
              : ""
          }
        </td>
      </tr>
    </table>

    ${
      data.shopPhone || data.shopEmail
        ? `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="margin:0;font-size:13px;color:#64748b;text-align:center;">
      Questions or need to reschedule? Contact us at
      ${data.shopPhone ? `<a href="tel:${data.shopPhone}" style="color:#1d4ed8;">${data.shopPhone}</a>` : ""}
      ${data.shopPhone && data.shopEmail ? " · " : ""}
      ${data.shopEmail ? `<a href="mailto:${data.shopEmail}" style="color:#1d4ed8;">${data.shopEmail}</a>` : ""}
    </p>`
        : ""
    }
  `

  return { subject, html: layout(data.shopName, content) }
}
