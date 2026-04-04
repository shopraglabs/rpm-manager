import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { requireAuth } from "@/lib/auth/session"
import { buildConnectUrl } from "@/lib/integrations/stripe"
import { disconnectStripe } from "@/modules/settings/actions"
import { prisma } from "@/lib/db"

export const metadata: Metadata = { title: "Billing & Payments" }

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { tenantId, role } = await requireAuth()
  if (role !== "OWNER") {
    return (
      <div className="max-w-2xl">
        <p className="text-muted-foreground text-sm">
          Only the shop owner can manage billing settings.
        </p>
      </div>
    )
  }

  const { success, error } = await searchParams

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, stripeAccountId: true },
  })

  const isConnected = !!tenant?.stripeAccountId
  const connectUrl = buildConnectUrl(tenantId)
  const connectEnabled = !!process.env.STRIPE_CONNECT_CLIENT_ID

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/settings" />}>
          <ChevronLeft className="h-4 w-4" />
          Settings
        </Button>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight mb-1">Billing & Payments</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Connect your Stripe account to accept credit card payments from customers.
      </p>

      {/* Feedback banners */}
      {success === "connected" && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          Stripe account connected successfully! Customers can now pay invoices online.
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          {decodeURIComponent(error)}
        </div>
      )}

      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">Stripe Connect</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isConnected
                ? `Connected — account ${tenant?.stripeAccountId}`
                : "Not connected. Link your Stripe account to enable online payments."}
            </p>
          </div>
          {isConnected ? (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium shrink-0">
              <CheckCircle2 className="h-4 w-4" />
              Connected
            </span>
          ) : (
            <span className="text-sm text-muted-foreground shrink-0">Not connected</span>
          )}
        </div>

        {!connectEnabled && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800">
            <strong>Setup required:</strong> Set <code>STRIPE_CONNECT_CLIENT_ID</code> in your
            environment to enable the OAuth flow.
          </div>
        )}

        <div className="flex gap-3 pt-1">
          {isConnected ? (
            <>
              <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" type="button">
                  Stripe Dashboard
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </a>
              <form
                action={async () => {
                  "use server"
                  await disconnectStripe()
                }}
              >
                <Button type="submit" variant="destructive" size="sm">
                  Disconnect
                </Button>
              </form>
            </>
          ) : (
            <a href={connectEnabled ? connectUrl : undefined}>
              <Button type="button" disabled={!connectEnabled} size="sm">
                Connect Stripe Account
              </Button>
            </a>
          )}
        </div>

        {isConnected && (
          <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How it works</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>When you send an invoice, customers receive a link to view and pay online.</li>
              <li>Payments are processed by Stripe and deposited directly to your bank account.</li>
              <li>A small platform fee (2.9% + $0.30) is charged per transaction.</li>
              <li>Payment status updates automatically via webhook.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
