"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"
import { workOrderSchema, statusTransitionSchema } from "./schemas"
import { assertValidTransition } from "./workflow"
import { generateWorkOrderNumber } from "@/lib/utils/sequence"
import { calculateTotals, parseLineItemsFromFormData } from "@/modules/estimates/utils"
import type { WorkOrderStatus } from "@/generated/prisma/enums"

export async function createWorkOrder(formData: FormData) {
  const { tenantId, id: userId, role } = await requireAuth()
  requirePermission(role, "work-orders:create")

  const raw = Object.fromEntries(formData)
  const parsed = workOrderSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  // Verify customer + vehicle belong to tenant
  const [customer, vehicle] = await Promise.all([
    prisma.customer.findFirst({ where: { id: parsed.data.customerId, tenantId } }),
    prisma.vehicle.findFirst({ where: { id: parsed.data.vehicleId, tenantId } }),
  ])
  if (!customer) return { error: "Customer not found" }
  if (!vehicle) return { error: "Vehicle not found" }

  const lineItems = parseLineItemsFromFormData(formData)
  const { subtotal, taxAmount, total } = calculateTotals(lineItems)
  const orderNumber = await generateWorkOrderNumber(tenantId)

  const workOrder = await prisma.workOrder.create({
    data: {
      tenantId,
      orderNumber,
      customerId: parsed.data.customerId,
      vehicleId: parsed.data.vehicleId,
      estimateId: parsed.data.estimateId || undefined,
      assignedToId: parsed.data.assignedToId || undefined,
      priority: parsed.data.priority,
      mileageIn: typeof parsed.data.mileageIn === "number" ? parsed.data.mileageIn : undefined,
      promisedDate: parsed.data.promisedDate ? new Date(parsed.data.promisedDate) : undefined,
      notes: parsed.data.notes || undefined,
      internalNotes: parsed.data.internalNotes || undefined,
      subtotal,
      taxAmount,
      total,
      statusHistory: {
        create: {
          fromStatus: "PENDING" as WorkOrderStatus,
          toStatus: "PENDING" as WorkOrderStatus,
          changedById: userId,
          note: "Work order created",
        },
      },
      lineItems: lineItems.length > 0 ? {
        create: lineItems.map((item) => ({
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          laborHours: item.laborHours,
          partNumber: item.partNumber,
          sortOrder: item.sortOrder ?? 0,
        })),
      } : undefined,
    },
  })

  revalidatePath("/work-orders")
  redirect(`/work-orders/${workOrder.id}`)
}

export async function updateWorkOrder(id: string, formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "work-orders:update")

  const existing = await prisma.workOrder.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Work order not found" }
  if (["DELIVERED", "CANCELLED"].includes(existing.status)) {
    return { error: "Cannot edit a closed work order" }
  }

  const raw = Object.fromEntries(formData)
  const parsed = workOrderSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const lineItems = parseLineItemsFromFormData(formData)
  const { subtotal, taxAmount, total } = calculateTotals(lineItems)

  await prisma.$transaction([
    prisma.workOrderLineItem.deleteMany({ where: { workOrderId: id } }),
    prisma.workOrder.update({
      where: { id },
      data: {
        assignedToId: parsed.data.assignedToId || undefined,
        priority: parsed.data.priority,
        mileageIn: typeof parsed.data.mileageIn === "number" ? parsed.data.mileageIn : undefined,
        promisedDate: parsed.data.promisedDate ? new Date(parsed.data.promisedDate) : undefined,
        notes: parsed.data.notes || undefined,
        internalNotes: parsed.data.internalNotes || undefined,
        subtotal,
        taxAmount,
        total,
        lineItems: lineItems.length > 0 ? {
          create: lineItems.map((item) => ({
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            laborHours: item.laborHours,
            partNumber: item.partNumber,
            sortOrder: item.sortOrder ?? 0,
          })),
        } : undefined,
      },
    }),
  ])

  revalidatePath(`/work-orders/${id}`)
  revalidatePath("/work-orders")
  redirect(`/work-orders/${id}`)
}

export async function transitionStatus(
  id: string,
  formData: FormData
) {
  const { tenantId, id: userId, role } = await requireAuth()
  requirePermission(role, "work-orders:status")

  const existing = await prisma.workOrder.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Work order not found" }

  const raw = Object.fromEntries(formData)
  const parsed = statusTransitionSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { toStatus, note } = parsed.data
  assertValidTransition(existing.status, toStatus as WorkOrderStatus)

  const now = new Date()
  const statusUpdates: Record<string, Date | null | undefined> = {}
  if (toStatus === "IN_PROGRESS" && !existing.startedAt) statusUpdates.startedAt = now
  if (toStatus === "COMPLETED") statusUpdates.completedAt = now

  await prisma.workOrder.update({
    where: { id },
    data: {
      status: toStatus as WorkOrderStatus,
      ...statusUpdates,
      statusHistory: {
        create: {
          fromStatus: existing.status,
          toStatus: toStatus as WorkOrderStatus,
          changedById: userId,
          note: note || undefined,
        },
      },
    },
  })

  revalidatePath(`/work-orders/${id}`)
  revalidatePath("/work-orders")
}

export async function deleteWorkOrder(id: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "work-orders:delete")

  const existing = await prisma.workOrder.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Work order not found" }

  await prisma.workOrder.delete({ where: { id } })

  revalidatePath("/work-orders")
  redirect("/work-orders")
}

/** Convert an approved estimate into a work order */
export async function convertEstimateToWorkOrder(estimateId: string) {
  const { tenantId, id: userId, role } = await requireAuth()
  requirePermission(role, "work-orders:create")

  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, tenantId },
    include: { lineItems: true },
  })
  if (!estimate) return { error: "Estimate not found" }
  if (estimate.status !== "APPROVED") return { error: "Estimate must be approved first" }

  const existing = await prisma.workOrder.findFirst({ where: { estimateId } })
  if (existing) return { error: "Work order already exists for this estimate" }

  const orderNumber = await generateWorkOrderNumber(tenantId)

  const workOrder = await prisma.$transaction(async (tx) => {
    const wo = await tx.workOrder.create({
      data: {
        tenantId,
        orderNumber,
        customerId: estimate.customerId,
        vehicleId: estimate.vehicleId,
        estimateId: estimate.id,
        subtotal: estimate.subtotal,
        taxAmount: estimate.taxAmount,
        total: estimate.total,
        statusHistory: {
          create: {
            fromStatus: "PENDING" as WorkOrderStatus,
            toStatus: "PENDING" as WorkOrderStatus,
            changedById: userId,
            note: `Converted from estimate ${estimate.estimateNumber}`,
          },
        },
        lineItems: {
          create: estimate.lineItems.map((item) => ({
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            laborHours: item.laborHours,
            partNumber: item.partNumber,
            sortOrder: item.sortOrder,
          })),
        },
      },
    })

    // Mark estimate as converted
    await tx.estimate.update({
      where: { id: estimateId },
      data: { status: "CONVERTED" },
    })

    return wo
  })

  revalidatePath(`/estimates/${estimateId}`)
  revalidatePath("/work-orders")
  redirect(`/work-orders/${workOrder.id}`)
}
