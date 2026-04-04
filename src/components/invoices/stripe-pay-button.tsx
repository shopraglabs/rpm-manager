"use client"

import { useState } from "react"
import { CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  invoiceToken: string
  amountDue: number
}

export function StripePayButton({ invoiceToken, amountDue }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: invoiceToken }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? "Failed to start checkout. Please try again.")
        return
      }
      window.location.href = data.url
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handlePay} disabled={loading} className="w-full" size="lg">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Redirecting to payment…
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay ${amountDue.toFixed(2)} Online
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
      <p className="text-xs text-center text-muted-foreground">Secured by Stripe · SSL encrypted</p>
    </div>
  )
}
