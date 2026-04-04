"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"

const serviceReminderSchema = z.object({
  service: z.string().min(1, "Service description is required"),
  dueDate: z.string().optional().or(z.literal("")),
  dueMileage: z.coerce.number().int().positive().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})

export async function createServiceReminder(vehicleId: string, formData: FormData) {
  const { tenantId } = await requireAuth()

  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, tenantId } })
  if (!vehicle) return { error: "Vehicle not found" }

  const raw = Object.fromEntries(formData)
  const parsed = serviceReminderSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.serviceReminder.create({
    data: {
      tenantId,
      vehicleId,
      customerId: vehicle.customerId,
      service: parsed.data.service,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      dueMileage: typeof parsed.data.dueMileage === "number" ? parsed.data.dueMileage : undefined,
      notes: parsed.data.notes || undefined,
    },
  })

  revalidatePath(`/vehicles/${vehicleId}`)
  return { success: true }
}

export async function completeServiceReminder(id: string, vehicleId: string) {
  const { tenantId } = await requireAuth()

  const reminder = await prisma.serviceReminder.findFirst({ where: { id, tenantId } })
  if (!reminder) return { error: "Reminder not found" }

  await prisma.serviceReminder.update({
    where: { id },
    data: { isCompleted: true, completedAt: new Date() },
  })

  revalidatePath(`/vehicles/${vehicleId}`)
  return { success: true }
}

export async function deleteServiceReminder(id: string, vehicleId: string) {
  const { tenantId } = await requireAuth()

  const reminder = await prisma.serviceReminder.findFirst({ where: { id, tenantId } })
  if (!reminder) return { error: "Reminder not found" }

  await prisma.serviceReminder.delete({ where: { id } })

  revalidatePath(`/vehicles/${vehicleId}`)
  return { success: true }
}
