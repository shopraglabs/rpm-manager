import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[stripe] STRIPE_SECRET_KEY is not set — Stripe features will be unavailable.")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
})

/** Build the OAuth URL to start the Stripe Connect flow for a shop owner. */
export function buildConnectUrl(tenantId: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.STRIPE_CONNECT_CLIENT_ID ?? "",
    scope: "read_write",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/callback`,
    state: tenantId,
  })
  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`
}

/** Exchange OAuth code for a connected account ID. */
export async function exchangeConnectCode(code: string): Promise<string> {
  const response = await stripe.oauth.token({
    grant_type: "authorization_code",
    code,
  })
  if (!response.stripe_user_id) throw new Error("No stripe_user_id in OAuth response")
  return response.stripe_user_id
}

/** Deauthorize / disconnect a connected account. */
export async function disconnectStripeAccount(stripeAccountId: string): Promise<void> {
  await stripe.oauth.deauthorize({
    client_id: process.env.STRIPE_CONNECT_CLIENT_ID ?? "",
    stripe_user_id: stripeAccountId,
  })
}

/**
 * Create a Stripe Checkout Session for a customer to pay an invoice.
 * Uses the connected account (on_behalf_of) and takes an application fee.
 */
export async function createCheckoutSession({
  stripeAccountId,
  invoiceToken,
  invoiceNumber,
  amountCents,
  customerEmail,
  shopName,
  successUrl,
  cancelUrl,
}: {
  stripeAccountId: string
  invoiceToken: string
  invoiceNumber: string
  amountCents: number
  customerEmail?: string | null
  shopName: string
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  // 2.9% + $0.30 application fee (adjust to your business model)
  const applicationFeeAmount = Math.round(amountCents * 0.029 + 30)

  return stripe.checkout.sessions.create(
    {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `Invoice ${invoiceNumber}`,
              description: `Payment to ${shopName}`,
            },
          },
        },
      ],
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        metadata: { invoiceToken },
      },
      metadata: { invoiceToken },
      success_url: successUrl,
      cancel_url: cancelUrl,
    },
    { stripeAccount: stripeAccountId }
  )
}
