"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"
import { STANDARD_INSPECTION_TEMPLATE } from "./templates"
import { emailProvider, inspectionEmail } from "@/lib/integrations/email"

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
    include: {
      workOrder: {
        include: {
          customer: true,
          vehicle: true,
        },
      },
      items: { select: { condition: true } },
    },
  })
  if (!inspection) return { error: "Inspection not found" }

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

  // Send email if customer has an email address
  const customer = inspection.workOrder.customer
  if (customer.email) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const vehicle = inspection.workOrder.vehicle
    const vehicleLabel = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")
    const urgentCount = inspection.items.filter((i) => i.condition === "URGENT").length
    const poorCount = inspection.items.filter((i) => i.condition === "POOR").length

    const { subject, html } = inspectionEmail({
      shopName: tenant?.name ?? "Your Auto Shop",
      shopPhone: tenant?.phone,
      shopEmail: tenant?.email,
      customerFirstName: customer.firstName,
      vehicleLabel: vehicleLabel || "your vehicle",
      urgentCount,
      poorCount,
      portalUrl: `${appUrl}/customer-portal/inspection/${shareToken}`,
    })

    await emailProvider.send({
      to: customer.email,
      subject,
      html,
      replyTo: tenant?.email ?? undefined,
    })
  }

  revalidatePath(`/inspections/${inspectionId}`)
  return { success: true, shareToken }
}
