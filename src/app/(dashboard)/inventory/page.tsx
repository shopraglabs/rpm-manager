import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Inventory",
}

export default function InventoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Inventory</h1>
      <p className="text-muted-foreground">Coming soon…</p>
    </div>
  )
}
