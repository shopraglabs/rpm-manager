import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { emailProvider } from "@/lib/integrations/email"
import { overdueInvoiceEmail } from "@/lib/integrations/email/templates"
import { formatCurrency, formatDate } from "@/lib/utils/format"

export const dynamic = "force-dynamic"

/**
 * Cron job: runs daily at 9am UTC
 * 1. Finds SENT / PARTIALLY_PAID invoices where dueDate < today
 * 2. Marks them OVERDUE
 * 3. Sends a reminder email to the customer (if they have an email)
 *
 * Protected by CRON_SECRET to prevent unauthenticated calls.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Find all invoices that should be marked overdue
  const staleInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["SENT", "PARTIALLY_PAID"] },
      dueDate: { lt: startOfToday },
      amountDue: { gt: 0 },
    },
    include: {
      customer: { select: { firstName: true, email: true } },
      tenant: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  })

  let marked = 0
  let emailed = 0

  for (const invoice of staleInvoices) {
    // Mark overdue
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "OVERDUE" },
    })
    marked++

    // Send reminder email if customer has email and invoice has a share token
    if (invoice.customer.email && invoice.shareToken) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      const portalUrl = `${appUrl}/customer-portal/invoices/${invoice.shareToken}`

      const { subject, html } = overdueInvoiceEmail({
        shopName: invoice.tenant.name,
        shopPhone: invoice.tenant.phone,
        shopEmail: invoice.tenant.email,
        customerFirstName: invoice.customer.firstName,
        invoiceNumber: invoice.invoiceNumber,
        amountDue: formatCurrency(invoice.amountDue.toNumber()),
        dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : "Past due",
        portalUrl,
      })

      try {
        await emailProvider.send({
          to: invoice.customer.email,
          subject,
          html,
          replyTo: invoice.tenant.email ?? undefined,
        })
        emailed++
      } catch (err) {
        console.error(`[mark-overdue] Failed to email invoice ${invoice.invoiceNumber}:`, err)
      }
    }
  }

  console.log(`[mark-overdue] Marked ${marked} invoices overdue, emailed ${emailed} customers`)
  return NextResponse.json({ ok: true, marked, emailed })
}
