import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Customers",
}

export default function CustomersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Customers</h1>
      <p className="text-muted-foreground">Coming soon…</p>
    </div>
  )
}
