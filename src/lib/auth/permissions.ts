import type { UserRole } from "@/generated/prisma/enums"

export const PERMISSIONS = {
  // Customers
  "customers:read": ["OWNER", "MANAGER", "SERVICE_WRITER", "TECHNICIAN"],
  "customers:create": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "customers:update": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "customers:delete": ["OWNER", "MANAGER"],

  // Vehicles
  "vehicles:read": ["OWNER", "MANAGER", "SERVICE_WRITER", "TECHNICIAN"],
  "vehicles:create": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "vehicles:update": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "vehicles:delete": ["OWNER", "MANAGER"],

  // Estimates
  "estimates:read": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "estimates:create": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "estimates:update": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "estimates:delete": ["OWNER", "MANAGER"],
  "estimates:send": ["OWNER", "MANAGER", "SERVICE_WRITER"],

  // Work Orders
  "work-orders:read": ["OWNER", "MANAGER", "SERVICE_WRITER", "TECHNICIAN"],
  "work-orders:create": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "work-orders:update": ["OWNER", "MANAGER", "SERVICE_WRITER", "TECHNICIAN"],
  "work-orders:status": ["OWNER", "MANAGER", "SERVICE_WRITER", "TECHNICIAN"],
  "work-orders:delete": ["OWNER", "MANAGER"],

  // Inspections
  "inspections:read": ["OWNER", "MANAGER", "SERVICE_WRITER", "TECHNICIAN"],
  "inspections:create": ["OWNER", "MANAGER", "TECHNICIAN"],
  "inspections:update": ["OWNER", "MANAGER", "TECHNICIAN"],
  "inspections:send": ["OWNER", "MANAGER", "SERVICE_WRITER"],

  // Appointments
  "appointments:read": ["OWNER", "MANAGER", "SERVICE_WRITER", "TECHNICIAN"],
  "appointments:create": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "appointments:update": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "appointments:delete": ["OWNER", "MANAGER"],

  // Inventory
  "inventory:read": ["OWNER", "MANAGER", "SERVICE_WRITER", "TECHNICIAN"],
  "inventory:create": ["OWNER", "MANAGER"],
  "inventory:update": ["OWNER", "MANAGER"],
  "inventory:delete": ["OWNER", "MANAGER"],

  // Invoices & Payments
  "invoices:read": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "invoices:create": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "invoices:update": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "invoices:void": ["OWNER", "MANAGER"],
  "invoices:send": ["OWNER", "MANAGER", "SERVICE_WRITER"],
  "payments:record": ["OWNER", "MANAGER", "SERVICE_WRITER"],

  // Settings & Users
  "settings:read": ["OWNER", "MANAGER"],
  "settings:update": ["OWNER"],
  "users:manage": ["OWNER", "MANAGER"],
  "billing:manage": ["OWNER"],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role)
}

export function requirePermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(
      `Forbidden: '${permission}' requires one of [${PERMISSIONS[permission].join(", ")}]`
    )
  }
}
