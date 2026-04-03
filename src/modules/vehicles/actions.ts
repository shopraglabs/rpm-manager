"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"
import { vehicleSchema, normalizeVehicleInput } from "./schemas"

export async function createVehicle(customerId: string, formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "vehicles:create")

  // Verify customer belongs to tenant
  const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId } })
  if (!customer) return { error: "Customer not found" }

  const raw = Object.fromEntries(formData)
  const parsed = vehicleSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      tenantId,
      customerId,
      ...normalizeVehicleInput(parsed.data),
    },
  })

  revalidatePath(`/customers/${customerId}`)
  redirect(`/vehicles/${vehicle.id}`)
}

export async function updateVehicle(id: string, formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "vehicles:update")

  const existing = await prisma.vehicle.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Vehicle not found" }

  const raw = Object.fromEntries(formData)
  const parsed = vehicleSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.vehicle.update({
    where: { id },
    data: normalizeVehicleInput(parsed.data),
  })

  revalidatePath(`/vehicles/${id}`)
  revalidatePath(`/customers/${existing.customerId}`)
  redirect(`/vehicles/${id}`)
}

export async function deleteVehicle(id: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "vehicles:delete")

  const existing = await prisma.vehicle.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Vehicle not found" }

  await prisma.vehicle.delete({ where: { id } })

  revalidatePath(`/customers/${existing.customerId}`)
  redirect(`/customers/${existing.customerId}`)
}
