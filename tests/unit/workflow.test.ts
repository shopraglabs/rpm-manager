import { describe, it, expect } from "vitest"
import {
  isValidTransition,
  assertValidTransition,
  getNextStatuses,
  isTerminalStatus,
  canGenerateInvoice,
} from "@/modules/work-orders/workflow"

describe("work order workflow", () => {
  it("allows valid transitions", () => {
    expect(isValidTransition("PENDING", "CHECKED_IN")).toBe(true)
    expect(isValidTransition("CHECKED_IN", "IN_PROGRESS")).toBe(true)
    expect(isValidTransition("COMPLETED", "READY_FOR_PICKUP")).toBe(true)
  })

  it("blocks invalid transitions", () => {
    expect(isValidTransition("PENDING", "DELIVERED")).toBe(false)
    expect(isValidTransition("DELIVERED", "PENDING")).toBe(false)
    expect(isValidTransition("CANCELLED", "IN_PROGRESS")).toBe(false)
  })

  it("allows cancellation from most statuses", () => {
    expect(isValidTransition("PENDING", "CANCELLED")).toBe(true)
    expect(isValidTransition("IN_PROGRESS", "CANCELLED")).toBe(true)
    expect(isValidTransition("CHECKED_IN", "CANCELLED")).toBe(true)
  })

  it("throws on invalid transition", () => {
    expect(() => assertValidTransition("DELIVERED", "PENDING")).toThrow()
  })

  it("returns correct next statuses", () => {
    const next = getNextStatuses("PENDING")
    expect(next).toContain("CHECKED_IN")
    expect(next).toContain("CANCELLED")
  })

  it("identifies terminal statuses", () => {
    expect(isTerminalStatus("DELIVERED")).toBe(true)
    expect(isTerminalStatus("CANCELLED")).toBe(true)
    expect(isTerminalStatus("IN_PROGRESS")).toBe(false)
  })

  it("allows invoice generation only after completion", () => {
    expect(canGenerateInvoice("COMPLETED")).toBe(true)
    expect(canGenerateInvoice("READY_FOR_PICKUP")).toBe(true)
    expect(canGenerateInvoice("DELIVERED")).toBe(true)
    expect(canGenerateInvoice("IN_PROGRESS")).toBe(false)
    expect(canGenerateInvoice("PENDING")).toBe(false)
  })
})
