export type LineItemInput = {
  type: "LABOR" | "PART" | "SUBLET" | "FEE" | "DISCOUNT"
  description: string
  quantity: number
  unitPrice: number
  laborHours?: number | null
  partNumber?: string | null
  sortOrder?: number
}

/**
 * Calculate totals for a set of line items.
 * Discounts reduce the subtotal; tax is applied after discounts.
 */
export function calculateTotals(
  lineItems: LineItemInput[],
  taxRate: number = 0
): { subtotal: number; taxAmount: number; total: number } {
  let subtotal = 0

  for (const item of lineItems) {
    const lineTotal = item.quantity * item.unitPrice
    if (item.type === "DISCOUNT") {
      subtotal -= Math.abs(lineTotal)
    } else {
      subtotal += lineTotal
    }
  }

  subtotal = Math.max(0, subtotal)
  const taxAmount = parseFloat((subtotal * (taxRate / 100)).toFixed(2))
  const total = parseFloat((subtotal + taxAmount).toFixed(2))
  subtotal = parseFloat(subtotal.toFixed(2))

  return { subtotal, taxAmount, total }
}

/**
 * Parse line items from FormData.
 * Expects fields: lineItems[n][field]
 */
export function parseLineItemsFromFormData(formData: FormData): LineItemInput[] {
  const entries = Array.from(formData.entries())
  const lineItemMap = new Map<number, Partial<LineItemInput>>()

  for (const [key, value] of entries) {
    const match = key.match(/^lineItems\[(\d+)\]\[(\w+)\]$/)
    if (!match) continue
    const idx = parseInt(match[1]!, 10)
    const field = match[2]!

    if (!lineItemMap.has(idx)) lineItemMap.set(idx, {})
    const item = lineItemMap.get(idx)!

    switch (field) {
      case "type":
        item.type = value as LineItemInput["type"]
        break
      case "description":
        item.description = value as string
        break
      case "quantity":
        item.quantity = parseFloat(value as string) || 1
        break
      case "unitPrice":
        item.unitPrice = parseFloat(value as string) || 0
        break
      case "laborHours":
        item.laborHours = value ? parseFloat(value as string) : null
        break
      case "partNumber":
        item.partNumber = value ? (value as string) : null
        break
      case "sortOrder":
        item.sortOrder = parseInt(value as string, 10)
        break
    }
  }

  return Array.from(lineItemMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, item], position) => ({
      type: item.type ?? "LABOR",
      description: item.description ?? "",
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice ?? 0,
      laborHours: item.laborHours ?? null,
      partNumber: item.partNumber ?? null,
      sortOrder: item.sortOrder ?? position,
    }))
}
