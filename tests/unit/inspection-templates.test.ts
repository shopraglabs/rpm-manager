import { describe, it, expect } from "vitest"
import {
  STANDARD_INSPECTION_TEMPLATE,
  CONDITION_LABELS,
  CONDITION_COLORS,
  type TemplateItem,
} from "@/modules/inspections/templates"

// ─── STANDARD_INSPECTION_TEMPLATE ────────────────────────────────────────────

describe("STANDARD_INSPECTION_TEMPLATE", () => {
  it("has 38 items", () => {
    expect(STANDARD_INSPECTION_TEMPLATE).toHaveLength(38)
  })

  it("contains exactly 6 categories", () => {
    const categories = new Set(STANDARD_INSPECTION_TEMPLATE.map((i) => i.category))
    expect(categories.size).toBe(6)
  })

  it("contains all expected categories", () => {
    const categories = new Set(STANDARD_INSPECTION_TEMPLATE.map((i) => i.category))
    expect(categories).toContain("Engine & Fluids")
    expect(categories).toContain("Brakes")
    expect(categories).toContain("Tires & Wheels")
    expect(categories).toContain("Steering & Suspension")
    expect(categories).toContain("Lights & Electrical")
    expect(categories).toContain("Under Vehicle")
  })

  it("has 8 items in Engine & Fluids", () => {
    const count = STANDARD_INSPECTION_TEMPLATE.filter(
      (i) => i.category === "Engine & Fluids"
    ).length
    expect(count).toBe(8)
  })

  it("has 6 items in Brakes", () => {
    const count = STANDARD_INSPECTION_TEMPLATE.filter(
      (i) => i.category === "Brakes"
    ).length
    expect(count).toBe(6)
  })

  it("has 6 items in Tires & Wheels", () => {
    const count = STANDARD_INSPECTION_TEMPLATE.filter(
      (i) => i.category === "Tires & Wheels"
    ).length
    expect(count).toBe(6)
  })

  it("has 6 items in Steering & Suspension", () => {
    const count = STANDARD_INSPECTION_TEMPLATE.filter(
      (i) => i.category === "Steering & Suspension"
    ).length
    expect(count).toBe(6)
  })

  it("has 7 items in Lights & Electrical", () => {
    const count = STANDARD_INSPECTION_TEMPLATE.filter(
      (i) => i.category === "Lights & Electrical"
    ).length
    expect(count).toBe(7)
  })

  it("has 5 items in Under Vehicle", () => {
    const count = STANDARD_INSPECTION_TEMPLATE.filter(
      (i) => i.category === "Under Vehicle"
    ).length
    expect(count).toBe(5)
  })

  it("every item has a non-empty name", () => {
    for (const item of STANDARD_INSPECTION_TEMPLATE) {
      expect(item.name.trim().length).toBeGreaterThan(0)
    }
  })

  it("every item has a non-negative sortOrder", () => {
    for (const item of STANDARD_INSPECTION_TEMPLATE) {
      expect(item.sortOrder).toBeGreaterThanOrEqual(0)
    }
  })

  it("every item has a non-empty category", () => {
    for (const item of STANDARD_INSPECTION_TEMPLATE) {
      expect(item.category.trim().length).toBeGreaterThan(0)
    }
  })

  it("sortOrders within each category start at 0", () => {
    const categories = [...new Set(STANDARD_INSPECTION_TEMPLATE.map((i) => i.category))]
    for (const cat of categories) {
      const items = STANDARD_INSPECTION_TEMPLATE.filter((i) => i.category === cat)
      const minOrder = Math.min(...items.map((i) => i.sortOrder))
      expect(minOrder).toBe(0)
    }
  })

  it("contains critical safety items", () => {
    const names = STANDARD_INSPECTION_TEMPLATE.map((i) => i.name)
    expect(names).toContain("Front brake pads")
    expect(names).toContain("Rear brake pads")
    expect(names).toContain("Headlights")
    expect(names).toContain("Battery")
    expect(names).toContain("Engine oil level")
  })

  it("conforms to TemplateItem shape", () => {
    for (const item of STANDARD_INSPECTION_TEMPLATE) {
      const typed: TemplateItem = item
      expect(typeof typed.category).toBe("string")
      expect(typeof typed.name).toBe("string")
      expect(typeof typed.sortOrder).toBe("number")
    }
  })
})

// ─── CONDITION_LABELS ─────────────────────────────────────────────────────────

describe("CONDITION_LABELS", () => {
  it("has entries for all four conditions", () => {
    expect(CONDITION_LABELS).toHaveProperty("GOOD")
    expect(CONDITION_LABELS).toHaveProperty("FAIR")
    expect(CONDITION_LABELS).toHaveProperty("POOR")
    expect(CONDITION_LABELS).toHaveProperty("URGENT")
  })

  it("maps GOOD to 'Good'", () => {
    expect(CONDITION_LABELS["GOOD"]).toBe("Good")
  })

  it("maps URGENT to 'Urgent'", () => {
    expect(CONDITION_LABELS["URGENT"]).toBe("Urgent")
  })

  it("all labels are non-empty strings", () => {
    for (const label of Object.values(CONDITION_LABELS)) {
      expect(typeof label).toBe("string")
      expect(label.length).toBeGreaterThan(0)
    }
  })
})

// ─── CONDITION_COLORS ─────────────────────────────────────────────────────────

describe("CONDITION_COLORS", () => {
  const conditions = ["GOOD", "FAIR", "POOR", "URGENT"] as const

  it("has entries for all four conditions", () => {
    for (const condition of conditions) {
      expect(CONDITION_COLORS).toHaveProperty(condition)
    }
  })

  it("each entry has bg, text, and border keys", () => {
    for (const condition of conditions) {
      const colors = CONDITION_COLORS[condition]
      expect(colors).toHaveProperty("bg")
      expect(colors).toHaveProperty("text")
      expect(colors).toHaveProperty("border")
    }
  })

  it("all color strings are non-empty Tailwind classes", () => {
    for (const condition of conditions) {
      const colors = CONDITION_COLORS[condition]!
      expect(colors.bg.trim().length).toBeGreaterThan(0)
      expect(colors.text.trim().length).toBeGreaterThan(0)
      expect(colors.border.trim().length).toBeGreaterThan(0)
    }
  })

  it("GOOD uses green colors", () => {
    const colors = CONDITION_COLORS["GOOD"]!
    expect(colors.bg).toContain("green")
    expect(colors.text).toContain("green")
  })

  it("URGENT uses red colors", () => {
    const colors = CONDITION_COLORS["URGENT"]!
    expect(colors.bg).toContain("red")
    expect(colors.text).toContain("red")
  })

  it("FAIR uses yellow colors", () => {
    const colors = CONDITION_COLORS["FAIR"]!
    expect(colors.bg).toContain("yellow")
  })

  it("POOR uses orange colors", () => {
    const colors = CONDITION_COLORS["POOR"]!
    expect(colors.bg).toContain("orange")
  })
})
