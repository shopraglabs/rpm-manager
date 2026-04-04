import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EstimateFormShell } from "@/components/estimates/estimate-form-shell"
import { createInventoryItem } from "@/modules/inventory/actions"

export const metadata: Metadata = { title: "Add Part" }

export default function NewInventoryItemPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/inventory" />}>
          <ChevronLeft className="h-4 w-4" />
          Inventory
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Add Part</h1>
      </div>

      <EstimateFormShell
        action={createInventoryItem}
        submitLabel="Add to Inventory"
        cancelSlot={
          <Button type="button" variant="outline" render={<Link href="/inventory" />}>
            Cancel
          </Button>
        }
      >
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-medium">Part Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partNumber">Part number *</Label>
              <Input id="partNumber" name="partNumber" placeholder="SKU-12345" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" placeholder="ACDelco" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" placeholder="Oil Filter" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" placeholder="Filters, Brakes…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="Shelf A3" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-medium">Pricing &amp; Stock</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (your price)</Label>
              <Input id="cost" name="cost" type="number" min="0" step="0.01" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Sell price</Label>
              <Input id="price" name="price" type="number" min="0" step="0.01" defaultValue="0" />
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
                defaultValue="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderPoint">Reorder point</Label>
              <Input id="reorderPoint" name="reorderPoint" type="number" min="0" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderQuantity">Reorder qty</Label>
              <Input
                id="reorderQuantity"
                name="reorderQuantity"
                type="number"
                min="0"
                defaultValue="0"
              />
            </div>
          </div>
        </div>
      </EstimateFormShell>
    </div>
  )
}
