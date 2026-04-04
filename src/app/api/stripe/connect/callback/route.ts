import { type NextRequest, NextResponse } from "next/server"
import { exchangeConnectCode } from "@/lib/integrations/stripe"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const state = searchParams.get("state") // tenantId
  const error = searchParams.get("error")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""

  if (error || !code || !state) {
    const msg = error === "access_denied" ? "Connection cancelled." : "Stripe connection failed."
    return NextResponse.redirect(`${appUrl}/settings/billing?error=${encodeURIComponent(msg)}`)
  }

  try {
    const stripeAccountId = await exchangeConnectCode(code)

    await prisma.tenant.update({
      where: { id: state },
      data: { stripeAccountId },
    })

    return NextResponse.redirect(`${appUrl}/settings/billing?success=connected`)
  } catch (err) {
    console.error("[stripe/connect/callback]", err)
    return NextResponse.redirect(
      `${appUrl}/settings/billing?error=${encodeURIComponent("Failed to connect Stripe account.")}`
    )
  }
}
