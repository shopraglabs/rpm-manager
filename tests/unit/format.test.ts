import { describe, it, expect } from "vitest"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  truncate,
  slugify,
} from "@/lib/utils/format"

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats a positive integer", () => {
    expect(formatCurrency(100)).toBe("$100.00")
  })

  it("formats a decimal amount", () => {
    expect(formatCurrency(49.99)).toBe("$49.99")
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00")
  })

  it("formats a large number with commas", () => {
    expect(formatCurrency(12345.67)).toBe("$12,345.67")
  })

  it("accepts a string amount", () => {
    expect(formatCurrency("250.00")).toBe("$250.00")
  })

  it("accepts an object with toString() (Prisma Decimal-like)", () => {
    const decimal = { toString: () => "99.95" }
    expect(formatCurrency(decimal)).toBe("$99.95")
  })

  it("returns $0.00 for null", () => {
    expect(formatCurrency(null)).toBe("$0.00")
  })

  it("returns $0.00 for undefined", () => {
    expect(formatCurrency(undefined)).toBe("$0.00")
  })

  it("handles negative amounts", () => {
    // Discounts stored as negative
    expect(formatCurrency(-25)).toBe("-$25.00")
  })
})

// ─── formatDate ───────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("returns '—' for null", () => {
    expect(formatDate(null)).toBe("—")
  })

  it("returns '—' for undefined", () => {
    expect(formatDate(undefined)).toBe("—")
  })

  it("formats a Date object in en-US locale", () => {
    // Use a fixed UTC date to avoid timezone-dependent failures
    const date = new Date("2025-06-15T00:00:00Z")
    const result = formatDate(date)
    // Should contain "Jun" and "2025"
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/2025/)
  })

  it("formats an ISO string", () => {
    const result = formatDate("2024-01-05T00:00:00Z")
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/2024/)
  })

  it("accepts custom format options", () => {
    // Use mid-month UTC to avoid day-boundary timezone shifts
    const date = new Date("2025-03-15T12:00:00Z")
    const result = formatDate(date, { month: "long", year: "numeric" })
    expect(result).toMatch(/March/)
    expect(result).toMatch(/2025/)
  })
})

// ─── formatDateTime ───────────────────────────────────────────────────────────

describe("formatDateTime", () => {
  it("returns '—' for null", () => {
    expect(formatDateTime(null)).toBe("—")
  })

  it("includes time component", () => {
    const result = formatDateTime("2025-06-15T14:30:00Z")
    // Should include AM/PM or colon-separated time
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})

// ─── formatPhone ──────────────────────────────────────────────────────────────

describe("formatPhone", () => {
  it("returns '—' for null", () => {
    expect(formatPhone(null)).toBe("—")
  })

  it("returns '—' for undefined", () => {
    expect(formatPhone(undefined)).toBe("—")
  })

  it("formats a 10-digit number", () => {
    expect(formatPhone("5558675309")).toBe("(555) 867-5309")
  })

  it("strips non-digit characters before formatting", () => {
    expect(formatPhone("555-867-5309")).toBe("(555) 867-5309")
    expect(formatPhone("(555) 867-5309")).toBe("(555) 867-5309")
    // 11 digits after stripping — not a 10-digit number so original string is returned
    expect(formatPhone("+15558675309")).toBe("+15558675309")
  })

  it("returns original string for non-10-digit numbers", () => {
    expect(formatPhone("12345")).toBe("12345")
    expect(formatPhone("555-12345")).toBe("555-12345")
  })

  it("returns '—' for empty string", () => {
    expect(formatPhone("")).toBe("—")
  })
})

// ─── truncate ─────────────────────────────────────────────────────────────────

describe("truncate", () => {
  it("returns the string unchanged when at or under maxLength", () => {
    expect(truncate("Hello", 10)).toBe("Hello")
    expect(truncate("Hello", 5)).toBe("Hello")
  })

  it("truncates and appends ellipsis when over maxLength", () => {
    expect(truncate("Hello, world!", 5)).toBe("Hello…")
  })

  it("handles empty string", () => {
    expect(truncate("", 10)).toBe("")
  })

  it("handles maxLength of 0", () => {
    expect(truncate("Hello", 0)).toBe("…")
  })
})

// ─── slugify ──────────────────────────────────────────────────────────────────

describe("slugify", () => {
  it("lowercases the string", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("replaces spaces with hyphens", () => {
    expect(slugify("oil change service")).toBe("oil-change-service")
  })

  it("removes special characters", () => {
    expect(slugify("Brake Pad (Front)")).toBe("brake-pad-front")
  })

  it("collapses multiple hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world")
  })

  it("handles leading and trailing spaces", () => {
    // Spaces become hyphens before trim(), so surrounding hyphens remain
    expect(slugify("  trim me  ")).toBe("-trim-me-")
  })

  it("handles empty string", () => {
    expect(slugify("")).toBe("")
  })

  it("handles already-slugified strings unchanged", () => {
    expect(slugify("already-a-slug")).toBe("already-a-slug")
  })
})
