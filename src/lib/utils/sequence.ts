import { prisma } from "@/lib/db"

/**
 * Generate the next sequential estimate number for a tenant.
 * Format: EST-XXXX (zero-padded to 4 digits)
 */
export async function generateEstimateNumber(tenantId: string): Promise<string> {
  const count = await prisma.estimate.count({ where: { tenantId } })
  return `EST-${String(count + 1).padStart(4, "0")}`
}

/**
 * Generate the next sequential work order number for a tenant.
 * Format: WO-XXXX
 */
export async function generateWorkOrderNumber(tenantId: string): Promise<string> {
  const count = await prisma.workOrder.count({ where: { tenantId } })
  return `WO-${String(count + 1).padStart(4, "0")}`
}

/**
 * Generate the next sequential invoice number for a tenant.
 * Format: INV-XXXX
 */
export async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const count = await prisma.invoice.count({ where: { tenantId } })
  return `INV-${String(count + 1).padStart(4, "0")}`
}

/**
 * Generate a cryptographically random share token for public links.
 * Used for estimate/invoice/inspection share URLs.
 */
export function generateShareToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}
