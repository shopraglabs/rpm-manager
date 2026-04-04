import { type NextRequest, NextResponse } from "next/server"
import { createCheckoutSession } from "@/lib/integrations/stripe"
import { getInvoiceByToken } from "@/modules/invoices/queries"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { token } = (await req.json()) as { token: string }
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

    const invoice = await getInvoiceByToken(token)
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

    const amountDue = invoice.amountDue.toNumber()
    if (amountDue <= 0) {
      return NextResponse.json({ error: "Invoice already paid" }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: invoice.tenantId },
      select: { name: true, stripeAccountId: true },
    })

    if (!tenant?.stripeAccountId) {
      return NextResponse.json(
        { error: "This shop has not enabled online payments." },
        { status: 422 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
    const portalUrl = `${appUrl}/customer-portal/invoices/${token}`

    const session = await createCheckoutSession({
      stripeAccountId: tenant.stripeAccountId,
      invoiceToken: token,
      invoiceNumber: invoice.invoiceNumber,
      amountCents: Math.round(amountDue * 100),
      customerEmail: invoice.customer.email,
      shopName: tenant.name,
      successUrl: `${portalUrl}?payment=success`,
      cancelUrl: `${portalUrl}?payment=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[stripe/checkout]", err)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
