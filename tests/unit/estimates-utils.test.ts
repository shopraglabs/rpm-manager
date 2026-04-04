import { describe, it, expect } from "vitest"
import { calculateTotals, parseLineItemsFromFormData } from "@/modules/estimates/utils"

// ─── calculateTotals ──────────────────────────────────────────────────────────

describe("calculateTotals", () => {
  it("returns zeros for an empty item list", () => {
    const result = calculateTotals([])
    expect(result).toEqual({ subtotal: 0, taxAmount: 0, total: 0 })
  })

  it("sums labor and part line items", () => {
    const items = [
      { type: "LABOR" as const, description: "Oil change", quantity: 1, unitPrice: 50 },
      { type: "PART" as const, description: "Oil filter", quantity: 1, unitPrice: 12 },
    ]
    const result = calculateTotals(items)
    expect(result.subtotal).toBe(62)
    expect(result.taxAmount).toBe(0)
    expect(result.total).toBe(62)
  })

  it("handles quantity > 1 correctly", () => {
    const items = [
      { type: "PART" as const, description: "Spark plug", quantity: 4, unitPrice: 8 },
    ]
    const result = calculateTotals(items)
    expect(result.subtotal).toBe(32)
  })

  it("subtracts DISCOUNT line items from the subtotal", () => {
    const items = [
      { type: "LABOR" as const, description: "Brake job", quantity: 1, unitPrice: 200 },
      { type: "DISCOUNT" as const, description: "Loyalty discount", quantity: 1, unitPrice: 20 },
    ]
    const result = calculateTotals(items)
    expect(result.subtotal).toBe(180)
  })

  it("treats DISCOUNT unitPrice as absolute (no double-negative)", () => {
    // unitPrice stored as positive; the function should still subtract it
    const items = [
      { type: "LABOR" as const, description: "Service", quantity: 1, unitPrice: 100 },
      { type: "DISCOUNT" as const, description: "10% off", quantity: 1, unitPrice: -10 },
    ]
    const result = calculateTotals(items)
    // Math.abs(-10 * 1) = 10 → 100 - 10 = 90
    expect(result.subtotal).toBe(90)
  })

  it("clamps subtotal to 0 when discounts exceed line total", () => {
    const items = [
      { type: "PART" as const, description: "Part", quantity: 1, unitPrice: 50 },
      { type: "DISCOUNT" as const, description: "100% off", quantity: 1, unitPrice: 200 },
    ]
    const result = calculateTotals(items)
    expect(result.subtotal).toBe(0)
    expect(result.total).toBe(0)
  })

  it("applies tax rate as a percentage", () => {
    const items = [
      { type: "LABOR" as const, description: "Tune up", quantity: 1, unitPrice: 100 },
    ]
    const result = calculateTotals(items, 10) // 10%
    expect(result.subtotal).toBe(100)
    expect(result.taxAmount).toBe(10)
    expect(result.total).toBe(110)
  })

  it("applies tax after discount is removed", () => {
    const items = [
      { type: "PART" as const, description: "Part", quantity: 1, unitPrice: 200 },
      { type: "DISCOUNT" as const, description: "Discount", quantity: 1, unitPrice: 50 },
    ]
    const result = calculateTotals(items, 10)
    expect(result.subtotal).toBe(150)
    expect(result.taxAmount).toBe(15)
    expect(result.total).toBe(165)
  })

  it("rounds tax and total to 2 decimal places", () => {
    const items = [
      { type: "LABOR" as const, description: "Labor", quantity: 1, unitPrice: 49.99 },
    ]
    const result = calculateTotals(items, 7.5)
    // 49.99 * 0.075 = 3.74925 → 3.75
    expect(result.taxAmount).toBe(3.75)
    expect(result.total).toBe(53.74)
  })

  it("includes SUBLET and FEE types in subtotal", () => {
    const items = [
      { type: "SUBLET" as const, description: "Alignment", quantity: 1, unitPrice: 80 },
      { type: "FEE" as const, description: "Shop supply fee", quantity: 1, unitPrice: 15 },
    ]
    const result = calculateTotals(items)
    expect(result.subtotal).toBe(95)
  })

  it("handles zero-priced items without error", () => {
    const items = [
      { type: "LABOR" as const, description: "Inspection", quantity: 1, unitPrice: 0 },
    ]
    const result = calculateTotals(items)
    expect(result).toEqual({ subtotal: 0, taxAmount: 0, total: 0 })
  })
})

// ─── parseLineItemsFromFormData ───────────────────────────────────────────────

describe("parseLineItemsFromFormData", () => {
  function buildFormData(items: Record<string, string>[]): FormData {
    const fd = new FormData()
    items.forEach((item, i) => {
      Object.entries(item).forEach(([field, value]) => {
        fd.append(`lineItems[${i}][${field}]`, value)
      })
    })
    return fd
  }

  it("parses a single labor line item", () => {
    const fd = buildFormData([
      { type: "LABOR", description: "Oil change", quantity: "1", unitPrice: "49.99" },
    ])
    const items = parseLineItemsFromFormData(fd)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      type: "LABOR",
      description: "Oil change",
      quantity: 1,
      unitPrice: 49.99,
    })
  })

  it("parses multiple items in index order", () => {
    const fd = buildFormData([
      { type: "LABOR", description: "First", quantity: "1", unitPrice: "10" },
      { type: "PART", description: "Second", quantity: "2", unitPrice: "5" },
    ])
    const items = parseLineItemsFromFormData(fd)
    expect(items).toHaveLength(2)
    expect(items[0]!.description).toBe("First")
    expect(items[1]!.description).toBe("Second")
  })

  it("defaults type to LABOR when missing", () => {
    const fd = new FormData()
    fd.append("lineItems[0][description]", "Test")
    fd.append("lineItems[0][quantity]", "1")
    fd.append("lineItems[0][unitPrice]", "0")
    const items = parseLineItemsFromFormData(fd)
    expect(items[0]!.type).toBe("LABOR")
  })

  it("defaults quantity to 1 when invalid", () => {
    const fd = new FormData()
    fd.append("lineItems[0][type]", "PART")
    fd.append("lineItems[0][description]", "Test")
    fd.append("lineItems[0][quantity]", "bad")
    fd.append("lineItems[0][unitPrice]", "0")
    const items = parseLineItemsFromFormData(fd)
    expect(items[0]!.quantity).toBe(1)
  })

  it("defaults unitPrice to 0 when invalid", () => {
    const fd = new FormData()
    fd.append("lineItems[0][type]", "PART")
    fd.append("lineItems[0][description]", "Test")
    fd.append("lineItems[0][quantity]", "1")
    fd.append("lineItems[0][unitPrice]", "nope")
    const items = parseLineItemsFromFormData(fd)
    expect(items[0]!.unitPrice).toBe(0)
  })

  it("parses optional laborHours", () => {
    const fd = buildFormData([
      { type: "LABOR", description: "Labor", quantity: "1", unitPrice: "100", laborHours: "2.5" },
    ])
    const items = parseLineItemsFromFormData(fd)
    expect(items[0]!.laborHours).toBe(2.5)
  })

  it("sets laborHours to null when empty string", () => {
    const fd = buildFormData([
      { type: "LABOR", description: "Labor", quantity: "1", unitPrice: "100", laborHours: "" },
    ])
    const items = parseLineItemsFromFormData(fd)
    expect(items[0]!.laborHours).toBeNull()
  })

  it("parses optional partNumber", () => {
    const fd = buildFormData([
      { type: "PART", description: "Part", quantity: "1", unitPrice: "10", partNumber: "OEM-123" },
    ])
    const items = parseLineItemsFromFormData(fd)
    expect(items[0]!.partNumber).toBe("OEM-123")
  })

  it("sets partNumber to null when empty string", () => {
    const fd = buildFormData([
      { type: "PART", description: "Part", quantity: "1", unitPrice: "10", partNumber: "" },
    ])
    const items = parseLineItemsFromFormData(fd)
    expect(items[0]!.partNumber).toBeNull()
  })

  it("ignores unrelated form fields", () => {
    const fd = buildFormData([
      { type: "LABOR", description: "Labor", quantity: "1", unitPrice: "50" },
    ])
    fd.append("someOtherField", "value")
    fd.append("_action", "save")
    const items = parseLineItemsFromFormData(fd)
    expect(items).toHaveLength(1)
  })

  it("returns empty array when no lineItems keys exist", () => {
    const fd = new FormData()
    fd.append("description", "not a line item")
    const items = parseLineItemsFromFormData(fd)
    expect(items).toHaveLength(0)
  })

  it("assigns sortOrder from form data when provided", () => {
    const fd = buildFormData([
      { type: "LABOR", description: "A", quantity: "1", unitPrice: "0", sortOrder: "5" },
    ])
    const items = parseLineItemsFromFormData(fd)
    expect(items[0]!.sortOrder).toBe(5)
  })

  it("falls back to index position when sortOrder is missing", () => {
    const fd = buildFormData([
      { type: "LABOR", description: "A", quantity: "1", unitPrice: "0" },
      { type: "PART", description: "B", quantity: "1", unitPrice: "0" },
    ])
    const items = parseLineItemsFromFormData(fd)
    expect(items[0]!.sortOrder).toBe(0)
    expect(items[1]!.sortOrder).toBe(1)
  })
})
