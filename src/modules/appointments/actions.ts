"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"

const appointmentSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().optional().or(z.literal("")),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().or(z.literal("")),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  assignedToId: z.string().optional().or(z.literal("")),
  vehicleId: z.string().optional().or(z.literal("")),
})

export async function createAppointment(formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "appointments:create")

  const raw = Object.fromEntries(formData)
  const parsed = appointmentSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const start = new Date(parsed.data.startTime)
  const end = new Date(parsed.data.endTime)
  if (end <= start) return { error: "End time must be after start time" }

  const appointment = await prisma.appointment.create({
    data: {
      tenantId,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone || undefined,
      customerEmail: parsed.data.customerEmail || undefined,
      title: parsed.data.title,
      description: parsed.data.description || undefined,
      startTime: start,
      endTime: end,
      assignedToId: parsed.data.assignedToId || undefined,
      vehicleId: parsed.data.vehicleId || undefined,
    },
  })

  revalidatePath("/appointments")
  redirect(`/appointments?date=${start.toISOString().split("T")[0]}`)
}

export async function updateAppointmentStatus(
  id: string,
  status: "SCHEDULED" | "CONFIRMED" | "ARRIVED" | "NO_SHOW" | "COMPLETED" | "CANCELLED"
) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "appointments:update")

  const existing = await prisma.appointment.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Appointment not found" }

  await prisma.appointment.update({
    where: { id },
    data: { status: status as never },
  })

  revalidatePath("/appointments")
  return { success: true }
}

export async function deleteAppointment(id: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "appointments:delete")

  const existing = await prisma.appointment.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Appointment not found" }

  await prisma.appointment.delete({ where: { id } })
  revalidatePath("/appointments")
}
