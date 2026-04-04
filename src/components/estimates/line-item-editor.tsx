"use client"

import { useState, useCallback } from "react"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils/format"

type LineItemType = "LABOR" | "PART" | "SUBLET" | "FEE" | "DISCOUNT"

type LineItem = {
  id: string // client-only key
  type: LineItemType
  description: string
  quantity: string
  unitPrice: string
  laborHours: string
  partNumber: string
  sortOrder: number
}

const TYPE_LABELS: Record<LineItemType, string> = {
  LABOR: "Labor",
  PART: "Part",
  SUBLET: "Sublet",
  FEE: "Fee",
  DISCOUNT: "Discount",
}

function newItem(sortOrder: number): LineItem {
  return {
    id: crypto.randomUUID(),
    type: "LABOR",
    description: "",
    quantity: "1",
    unitPrice: "0.00",
    laborHours: "",
    partNumber: "",
    sortOrder,
  }
}

function lineTotal(item: LineItem): number {
  const qty = parseFloat(item.quantity) || 0
  const price = parseFloat(item.unitPrice) || 0
  const total = qty * price
  return item.type === "DISCOUNT" ? -Math.abs(total) : total
}

type Props = {
  defaultItems?: Array<{
    type: string
    description: string
    quantity: number | string
    unitPrice: number | string
    laborHours?: number | null
    partNumber?: string | null
    sortOrder?: number
  }>
  taxRate?: number
}

export function LineItemEditor({ defaultItems, taxRate = 0 }: Props) {
  const [items, setItems] = useState<LineItem[]>(() => {
    if (defaultItems && defaultItems.length > 0) {
      return defaultItems.map((item, idx) => ({
        id: crypto.randomUUID(),
        type: item.type as LineItemType,
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        laborHours: item.laborHours != null ? String(item.laborHours) : "",
        partNumber: item.partNumber ?? "",
        sortOrder: item.sortOrder ?? idx,
      }))
    }
    return [newItem(0)]
  })

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, newItem(prev.length)])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const updateItem = useCallback((id: string, field: keyof LineItem, value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }, [])

  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0)
  const clampedSubtotal = Math.max(0, subtotal)
  const taxAmount = clampedSubtotal * (taxRate / 100)
  const total = clampedSubtotal + taxAmount

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="hidden md:grid md:grid-cols-[24px_1fr_100px_120px_120px_90px_40px] gap-2 text-xs text-muted-foreground px-1">
        <span />
        <span>Description</span>
        <span>Type</span>
        <span>Qty</span>
        <span>Unit price</span>
        <span className="text-right">Total</span>
        <span />
      </div>

      {/* Line items */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.id} className="group">
            {/* Hidden inputs for form submission */}
            <input type="hidden" name={`lineItems[${idx}][type]`} value={item.type} />
            <input type="hidden" name={`lineItems[${idx}][sortOrder]`} value={idx} />

            <div className="grid grid-cols-[24px_1fr] md:grid-cols-[24px_1fr_100px_120px_120px_90px_40px] gap-2 items-start md:items-center">
              {/* Drag handle (visual only for now) */}
              <div className="flex items-center justify-center h-9 text-muted-foreground/40 cursor-grab">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Description + sub-fields on mobile */}
              <div className="space-y-2 md:space-y-0 md:contents">
                <Input
                  name={`lineItems[${idx}][description]`}
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  placeholder={
                    item.type === "LABOR" ? "Describe the labor…" : "Part or service name…"
                  }
                  required
                  className="h-9"
                />

                {/* Type */}
                <div className="md:contents">
                  <Select
                    value={item.type}
                    onValueChange={(v) => v !== null && updateItem(item.id, "type", v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TYPE_LABELS) as LineItemType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <Input
                  name={`lineItems[${idx}][quantity]`}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                  className="h-9"
                />

                {/* Unit price */}
                <Input
                  name={`lineItems[${idx}][unitPrice]`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                  className="h-9"
                />

                {/* Total (read-only) */}
                <div className="flex items-center justify-end h-9 text-sm font-medium tabular-nums">
                  {item.type === "DISCOUNT" && lineTotal(item) < 0 ? (
                    <span className="text-destructive">
                      -{formatCurrency(Math.abs(lineTotal(item)))}
                    </span>
                  ) : (
                    formatCurrency(Math.max(0, lineTotal(item)))
                  )}
                </div>

                {/* Remove */}
                <div className="flex items-center justify-end md:justify-center h-9">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Secondary fields for LABOR (hours) and PART (part number) */}
            {(item.type === "LABOR" || item.type === "PART") && (
              <div className="ml-6 mt-1.5 grid grid-cols-2 gap-2 max-w-xs">
                {item.type === "LABOR" && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">Hours</label>
                    <Input
                      name={`lineItems[${idx}][laborHours]`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.laborHours}
                      onChange={(e) => updateItem(item.id, "laborHours", e.target.value)}
                      placeholder="0.0"
                      className="h-7 text-xs"
                    />
                  </div>
                )}
                {item.type === "PART" && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">
                      Part #
                    </label>
                    <Input
                      name={`lineItems[${idx}][partNumber]`}
                      value={item.partNumber}
                      onChange={(e) => updateItem(item.id, "partNumber", e.target.value)}
                      placeholder="SKU-123"
                      className="h-7 text-xs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add line item */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="w-full border-dashed"
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add line item
      </Button>

      {/* Totals */}
      <div className="border-t pt-4 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium tabular-nums">{formatCurrency(clampedSubtotal)}</span>
        </div>
        {taxRate > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax ({taxRate}%)</span>
            <span className="font-medium tabular-nums">{formatCurrency(taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold pt-1 border-t">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  )
}
