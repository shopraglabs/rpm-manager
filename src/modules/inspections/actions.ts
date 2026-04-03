"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"
import { STANDARD_INSPECTION_TEMPLATE } from "./templates"

export async function createInspection(workOrderId: string) {
  const { tenantId, id: userId, role } = await requireAuth()
  requirePermission(role, "inspections:create")

  const workOrder = await prisma.workOrder.findFirst({
    where: { id: workOrderId, tenantId },
    select: { id: true, vehicleId: true },
  })
  if (!workOrder) return { error: "Work order not found" }

  // Only one inspection per work order (for now)
  const existing = await prisma.inspection.findFirst({
    where: { workOrderId },
  })
  if (existing) {
    redirect(`/inspections/${existing.id}`)
  }

  const inspection = await prisma.inspection.create({
    data: {
      tenantId,
      workOrderId,
      vehicleId: workOrder.vehicleId,
      technicianId: userId,
      templateName: "Standard Inspection",
      items: {
        create: STANDARD_INSPECTION_TEMPLATE.map((item) => ({
          category: item.category,
          name: item.name,
          condition: "GOOD" as const,
          sortOrder: item.sortOrder,
        })),
      },
    },
  })

  revalidatePath(`/work-orders/${workOrderId}`)
  redirect(`/inspections/${inspection.id}`)
}

const updateItemSchema = z.object({
  condition: z.enum(["GOOD", "FAIR", "POOR", "URGENT"]),
  notes: z.string().optional().or(z.literal("")),
})

export async function updateInspectionItem(itemId: string, formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "inspections:update")

  // Verify ownership via inspection → tenant
  const item = await prisma.inspectionItem.findFirst({
    where: { id: itemId, inspection: { tenantId } },
    select: { id: true, inspectionId: true },
  })
  if (!item) return { error: "Item not found" }

  const raw = Object.fromEntries(formData)
  const parsed = updateItemSchema.safeParse(raw)
  if (!parsed.success) return { error: "Invalid input" }

  await prisma.inspectionItem.update({
    where: { id: itemId },
    data: {
      condition: parsed.data.condition,
      notes: parsed.data.notes || null,
    },
  })

  revalidatePath(`/inspections/${item.inspectionId}`)
  return { success: true }
}

export async function updateInspectionNotes(inspectionId: string, formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "inspections:update")

  const inspection = await prisma.inspection.findFirst({
    where: { id: inspectionId, tenantId },
  })
  if (!inspection) return { error: "Inspection not found" }

  await prisma.inspection.update({
    where: { id: inspectionId },
    data: { notes: (formData.get("notes") as string) || null },
  })

  revalidatePath(`/inspections/${inspectionId}`)
  return { success: true }
}

export async function completeInspection(inspectionId: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "inspections:update")

  const inspection = await prisma.inspection.findFirst({
    where: { id: inspectionId, tenantId },
  })
  if (!inspection) return { error: "Inspection not found" }

  await prisma.inspection.update({
    where: { id: inspectionId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  })

  revalidatePath(`/inspections/${inspectionId}`)
  revalidatePath(`/work-orders/${inspection.workOrderId}`)
  return { success: true }
}

export async function sendInspectionToCustomer(inspectionId: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "inspections:update")

  const inspection = await prisma.inspection.findFirst({
    where: { id: inspectionId, tenantId },
  })
  if (!inspection) return { error: "Inspection not found" }

  // Generate share token if not already set
  const shareToken = inspection.shareToken ?? crypto.randomUUID()

  await prisma.inspection.update({
    where: { id: inspectionId },
    data: {
      shareToken,
      status: "SENT",
      sentToCustomer: true,
      completedAt: inspection.completedAt ?? new Date(),
    },
  })

  revalidatePath(`/inspections/${inspectionId}`)
  return { success: true, shareToken }
}
