import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EstimateFormShell } from "@/components/estimates/estimate-form-shell"
import { StockAdjuster } from "./stock-adjuster"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { updateInventoryItem, deleteInventoryItem } from "@/modules/inventory/actions"
import { formatCurrency } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Part" }

export default async function InventoryItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>
}) {
  const { itemId } = await params
  const { tenantId } = await requireAuth()

  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, tenantId },
  })
  if (!item) notFound()

  const updateWithId = updateInventoryItem.bind(null, itemId)
  const deleteWithId = deleteInventoryItem.bind(null, itemId)

  const margin =
    item.cost.toNumber() > 0
      ? (((item.price.toNumber() - item.cost.toNumber()) / item.cost.toNumber()) * 100).toFixed(1)
      : null

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/inventory" />}>
          <ChevronLeft className="h-4 w-4" />
          Inventory
        </Button>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{item.name}</h1>
          <p className="text-muted-foreground text-sm font-mono mt-0.5">{item.partNumber}</p>
        </div>
      </div>

      {/* Stock summary */}
      <div className="rounded-xl border bg-card p-5 grid grid-cols-3 gap-4 text-sm mb-6">
        <div>
          <p className="text-muted-foreground">On hand</p>
          <p
            className={`text-2xl font-bold mt-0.5 tabular-nums ${item.quantityOnHand === 0 ? "text-destructive" : item.quantityOnHand <= item.reorderPoint ? "text-orange-600" : ""}`}
          >
            {item.quantityOnHand}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Cost / Price</p>
          <p className="font-semibold mt-0.5">
            {formatCurrency(item.cost.toNumber())} / {formatCurrency(item.price.toNumber())}
          </p>
          {margin && <p className="text-xs text-muted-foreground">{margin}% margin</p>}
        </div>
        <div>
          <p className="text-muted-foreground">Reorder at</p>
          <p className="font-semibold mt-0.5">
            {item.reorderPoint} (order {item.reorderQuantity})
          </p>
        </div>
      </div>

      {/* Stock adjuster */}
      <div className="mb-6">
        <StockAdjuster itemId={itemId} currentQty={item.quantityOnHand} />
      </div>

      {/* Edit form */}
      <EstimateFormShell
        action={updateWithId}
        submitLabel="Save Changes"
        deleteSlot={
          <form
            action={async () => {
              await deleteWithId()
            }}
            onSubmit={(e) => {
              if (!confirm("Delete this part? This cannot be undone.")) e.preventDefault()
            }}
          >
            <Button type="submit" variant="destructive" size="sm">
              Delete Part
            </Button>
          </form>
        }
      >
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-medium">Edit Part</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partNumber">Part number *</Label>
              <Input id="partNumber" name="partNumber" defaultValue={item.partNumber} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" defaultValue={item.brand ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" defaultValue={item.name} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" defaultValue={item.category ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={item.location ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={item.description ?? ""}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                min="0"
                step="0.01"
                defaultValue={item.cost.toNumber()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Sell price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={item.price.toNumber()}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantityOnHand">Qty on hand</Label>
              <Input
                id="quantityOnHand"
                name="quantityOnHand"
                type="number"
                min="0"
                defaultValue={item.quantityOnHand}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderPoint">Reorder point</Label>
              <Input
                id="reorderPoint"
                name="reorderPoint"
                type="number"
                min="0"
                defaultValue={item.reorderPoint}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderQuantity">Reorder qty</Label>
              <Input
                id="reorderQuantity"
                name="reorderQuantity"
                type="number"
                min="0"
                defaultValue={item.reorderQuantity}
              />
            </div>
          </div>
        </div>
      </EstimateFormShell>
    </div>
  )
}
