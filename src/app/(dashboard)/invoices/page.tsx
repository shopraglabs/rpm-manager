import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Invoices",
}

export default function InvoicesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Invoices</h1>
      <p className="text-muted-foreground">Coming soon…</p>
    </div>
  )
}
