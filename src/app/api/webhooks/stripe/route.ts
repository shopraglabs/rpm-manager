import { type NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { stripe } from "@/lib/integrations/stripe"
import { getInvoiceByToken } from "@/modules/invoices/queries"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const invoiceToken = session.metadata?.invoiceToken
  if (!invoiceToken) {
    console.warn("[stripe/webhook] checkout.session.completed missing invoiceToken metadata")
    return
  }

  const invoice = await getInvoiceByToken(invoiceToken)
  if (!invoice) {
    console.warn("[stripe/webhook] invoice not found for token", invoiceToken)
    return
  }

  // Prevent double-recording
  const alreadyRecorded = invoice.payments.some((p) => p.stripePaymentId === session.payment_intent)
  if (alreadyRecorded) return

  const amountPaid = (session.amount_total ?? 0) / 100

  // Record the payment
  await prisma.payment.create({
    data: {
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      amount: amountPaid,
      method: "CREDIT_CARD",
      stripePaymentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      reference: `Stripe Checkout`,
    },
  })

  // Recompute amount paid/due
  const allPayments = await prisma.payment.findMany({
    where: { invoiceId: invoice.id },
  })
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount.toNumber(), 0)
  const total = invoice.total.toNumber()
  const remaining = Math.max(0, total - totalPaid)
  const nowPaid = remaining <= 0.005

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      amountPaid: totalPaid,
      amountDue: remaining,
      status: nowPaid ? "PAID" : totalPaid > 0 ? "PARTIALLY_PAID" : invoice.status,
      ...(nowPaid ? { paidAt: new Date() } : {}),
    },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      default:
        // Ignore unhandled event types
        break
    }
  } catch (err) {
    console.error(`[stripe/webhook] Error handling ${event.type}:`, err)
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
