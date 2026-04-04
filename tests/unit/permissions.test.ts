import { describe, it, expect } from "vitest"
import { hasPermission, requirePermission, PERMISSIONS } from "@/lib/auth/permissions"
import type { UserRole } from "@/generated/prisma/enums"

// ─── hasPermission ────────────────────────────────────────────────────────────

describe("hasPermission", () => {
  // OWNER has all permissions
  it("grants OWNER all permissions", () => {
    const allPermissions = Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]
    for (const permission of allPermissions) {
      expect(hasPermission("OWNER", permission), `OWNER should have '${permission}'`).toBe(true)
    }
  })

  // Role-specific grants
  it("grants TECHNICIAN work-order read and update", () => {
    expect(hasPermission("TECHNICIAN", "work-orders:read")).toBe(true)
    expect(hasPermission("TECHNICIAN", "work-orders:update")).toBe(true)
    expect(hasPermission("TECHNICIAN", "work-orders:status")).toBe(true)
  })

  it("grants TECHNICIAN inspection read and update", () => {
    expect(hasPermission("TECHNICIAN", "inspections:read")).toBe(true)
    expect(hasPermission("TECHNICIAN", "inspections:update")).toBe(true)
  })

  it("grants SERVICE_WRITER customer and estimate access", () => {
    expect(hasPermission("SERVICE_WRITER", "customers:read")).toBe(true)
    expect(hasPermission("SERVICE_WRITER", "customers:create")).toBe(true)
    expect(hasPermission("SERVICE_WRITER", "estimates:create")).toBe(true)
    expect(hasPermission("SERVICE_WRITER", "estimates:send")).toBe(true)
  })

  it("grants MANAGER settings read", () => {
    expect(hasPermission("MANAGER", "settings:read")).toBe(true)
  })

  // Role-specific denials
  it("denies TECHNICIAN from creating estimates", () => {
    expect(hasPermission("TECHNICIAN", "estimates:create")).toBe(false)
  })

  it("denies TECHNICIAN from reading invoices", () => {
    expect(hasPermission("TECHNICIAN", "invoices:read")).toBe(false)
  })

  it("denies TECHNICIAN from managing users", () => {
    expect(hasPermission("TECHNICIAN", "users:manage")).toBe(false)
  })

  it("denies SERVICE_WRITER from deleting customers", () => {
    expect(hasPermission("SERVICE_WRITER", "customers:delete")).toBe(false)
  })

  it("denies SERVICE_WRITER from settings update", () => {
    expect(hasPermission("SERVICE_WRITER", "settings:update")).toBe(false)
  })

  it("denies SERVICE_WRITER from billing management", () => {
    expect(hasPermission("SERVICE_WRITER", "billing:manage")).toBe(false)
  })

  it("denies MANAGER from settings update (OWNER-only)", () => {
    expect(hasPermission("MANAGER", "settings:update")).toBe(false)
  })

  it("denies MANAGER from billing management (OWNER-only)", () => {
    expect(hasPermission("MANAGER", "billing:manage")).toBe(false)
  })

  it("denies TECHNICIAN from work-orders:create", () => {
    expect(hasPermission("TECHNICIAN", "work-orders:create")).toBe(false)
  })

  it("denies TECHNICIAN from deleting work orders", () => {
    expect(hasPermission("TECHNICIAN", "work-orders:delete")).toBe(false)
  })

  // Inventory access
  it("grants TECHNICIAN inventory read", () => {
    expect(hasPermission("TECHNICIAN", "inventory:read")).toBe(true)
  })

  it("denies TECHNICIAN inventory create/update/delete", () => {
    expect(hasPermission("TECHNICIAN", "inventory:create")).toBe(false)
    expect(hasPermission("TECHNICIAN", "inventory:update")).toBe(false)
    expect(hasPermission("TECHNICIAN", "inventory:delete")).toBe(false)
  })

  it("denies SERVICE_WRITER inventory create/update/delete", () => {
    expect(hasPermission("SERVICE_WRITER", "inventory:create")).toBe(false)
    expect(hasPermission("SERVICE_WRITER", "inventory:update")).toBe(false)
    expect(hasPermission("SERVICE_WRITER", "inventory:delete")).toBe(false)
  })
})

// ─── requirePermission ────────────────────────────────────────────────────────

describe("requirePermission", () => {
  it("does not throw when permission is granted", () => {
    expect(() => requirePermission("OWNER", "settings:update")).not.toThrow()
    expect(() => requirePermission("MANAGER", "settings:read")).not.toThrow()
    expect(() => requirePermission("TECHNICIAN", "work-orders:read")).not.toThrow()
  })

  it("throws when permission is denied", () => {
    expect(() => requirePermission("TECHNICIAN", "settings:update")).toThrow()
    expect(() => requirePermission("SERVICE_WRITER", "billing:manage")).toThrow()
    expect(() => requirePermission("MANAGER", "settings:update")).toThrow()
  })

  it("throws an error containing the permission name", () => {
    expect(() => requirePermission("TECHNICIAN", "invoices:void")).toThrowError("invoices:void")
  })

  it("throws an error containing the required roles", () => {
    expect(() => requirePermission("TECHNICIAN", "invoices:void")).toThrowError(/OWNER|MANAGER/)
  })

  it("throws an error mentioning Forbidden", () => {
    expect(() => requirePermission("SERVICE_WRITER", "customers:delete")).toThrowError(/Forbidden/i)
  })
})

// ─── PERMISSIONS shape ────────────────────────────────────────────────────────

describe("PERMISSIONS map", () => {
  it("has entries for all CRUD operations on core entities", () => {
    const entities = ["customers", "vehicles", "estimates", "work-orders", "invoices", "inventory"]
    for (const entity of entities) {
      expect(PERMISSIONS).toHaveProperty(`${entity}:read`)
    }
  })

  it("includes all four roles in work-orders:read", () => {
    const roles: UserRole[] = ["OWNER", "MANAGER", "SERVICE_WRITER", "TECHNICIAN"]
    for (const role of roles) {
      expect(hasPermission(role, "work-orders:read")).toBe(true)
    }
  })

  it("restricts settings:update to OWNER only", () => {
    expect(PERMISSIONS["settings:update"]).toEqual(["OWNER"])
  })

  it("restricts billing:manage to OWNER only", () => {
    expect(PERMISSIONS["billing:manage"]).toEqual(["OWNER"])
  })
})
