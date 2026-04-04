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
import { smsProvider } from "@/lib/integrations/sms"
import { vehicleReadySms } from "@/lib/integrations/sms/templates"
import { emailProvider } from "@/lib/integrations/email"
import { thankYouEmail } from "@/lib/integrations/email/templates"

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
      lineItems:
        lineItems.length > 0
          ? {
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
            }
          : undefined,
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
        lineItems:
          lineItems.length > 0
            ? {
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
              }
            : undefined,
      },
    }),
  ])

  revalidatePath(`/work-orders/${id}`)
  revalidatePath("/work-orders")
  redirect(`/work-orders/${id}`)
}

export async function transitionStatus(id: string, formData: FormData) {
  const { tenantId, id: userId, role } = await requireAuth()
  requirePermission(role, "work-orders:status")

  const existing = await prisma.workOrder.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Work order not found" }

  const raw = Object.fromEntries(formData)
  const parsed = statusTransitionSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { toStatus, note, mileageOut } = parsed.data
  assertValidTransition(existing.status, toStatus as WorkOrderStatus)

  const now = new Date()
  const statusUpdates: Record<string, Date | null | undefined> = {}
  if (toStatus === "IN_PROGRESS" && !existing.startedAt) statusUpdates.startedAt = now
  if (toStatus === "COMPLETED") statusUpdates.completedAt = now

  const mileageOutValue = typeof mileageOut === "number" ? mileageOut : undefined

  await prisma.workOrder.update({
    where: { id },
    data: {
      status: toStatus as WorkOrderStatus,
      ...statusUpdates,
      ...(mileageOutValue !== undefined ? { mileageOut: mileageOutValue } : {}),
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

  // Deduct inventory quantities for PART line items on COMPLETED
  if (toStatus === "COMPLETED") {
    try {
      const partLineItems = await prisma.workOrderLineItem.findMany({
        where: { workOrderId: id, type: "PART" },
        select: { partNumber: true, quantity: true },
      })
      const partNumbers = partLineItems
        .map((li) => li.partNumber)
        .filter((pn): pn is string => !!pn)

      if (partNumbers.length > 0) {
        const inventoryItems = await prisma.inventoryItem.findMany({
          where: { tenantId, partNumber: { in: partNumbers }, isActive: true },
          select: { id: true, partNumber: true },
        })
        const invMap = new Map(inventoryItems.map((inv) => [inv.partNumber, inv.id]))

        await Promise.all(
          partLineItems
            .filter((li) => li.partNumber && invMap.has(li.partNumber))
            .map((li) => {
              const invId = invMap.get(li.partNumber!)!
              const qty = Math.floor(Number(li.quantity))
              if (qty <= 0) return Promise.resolve()
              return prisma.inventoryItem.update({
                where: { id: invId },
                data: { quantityOnHand: { decrement: qty } },
              })
            })
        )
      }
    } catch (err) {
      console.error("[transitionStatus] Failed to deduct inventory:", err)
    }
  }

  // Update the vehicle's current mileage if mileageOut is provided and higher
  if (mileageOutValue !== undefined) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: existing.vehicleId },
      select: { id: true, mileage: true },
    })
    if (vehicle && (vehicle.mileage == null || mileageOutValue > vehicle.mileage)) {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { mileage: mileageOutValue },
      })
    }
  }

  // Auto-send "vehicle ready" SMS when transitioning to READY_FOR_PICKUP
  if (toStatus === "READY_FOR_PICKUP") {
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: { select: { phone: true, firstName: true, lastName: true } },
        vehicle: { select: { year: true, make: true, model: true } },
        tenant: { select: { name: true, phone: true } },
      },
    })
    if (wo?.customer.phone) {
      const vehicleLabel = [wo.vehicle.year, wo.vehicle.make, wo.vehicle.model]
        .filter(Boolean)
        .join(" ")
      await smsProvider.send({
        to: wo.customer.phone,
        body: vehicleReadySms({
          customerName: `${wo.customer.firstName} ${wo.customer.lastName}`,
          shopName: wo.tenant.name,
          shopPhone: wo.tenant.phone,
          vehicleLabel,
        }),
      })
    }
  }

  // Auto-send thank-you + review request email when DELIVERED
  if (toStatus === "DELIVERED") {
    try {
      const wo = await prisma.workOrder.findUnique({
        where: { id },
        include: {
          customer: { select: { email: true, firstName: true } },
          vehicle: { select: { year: true, make: true, model: true } },
          tenant: { select: { name: true, phone: true, email: true, reviewUrl: true } },
        },
      })
      if (wo?.customer.email) {
        const vehicleLabel = [wo.vehicle.year, wo.vehicle.make, wo.vehicle.model]
          .filter(Boolean)
          .join(" ")
        const { subject, html } = thankYouEmail({
          shopName: wo.tenant.name,
          shopPhone: wo.tenant.phone,
          shopEmail: wo.tenant.email,
          customerFirstName: wo.customer.firstName,
          vehicleLabel,
          orderNumber: existing.orderNumber,
          reviewUrl: wo.tenant.reviewUrl,
        })
        await emailProvider.send({
          to: wo.customer.email,
          subject,
          html,
          replyTo: wo.tenant.email ?? undefined,
        })
      }
    } catch (err) {
      console.error("[transitionStatus] Failed to send thank-you email:", err)
    }
  }

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

/** Append a timestamped internal note to a work order without a full edit */
export async function addWorkOrderNote(id: string, formData: FormData) {
  const { tenantId, id: userId } = await requireAuth()

  const text = (formData.get("note") as string)?.trim()
  if (!text) return { error: "Note cannot be empty" }
  if (text.length > 2000) return { error: "Note is too long (max 2000 characters)" }

  const [wo, user] = await Promise.all([
    prisma.workOrder.findFirst({ where: { id, tenantId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } }),
  ])
  if (!wo) return { error: "Work order not found" }

  const timestamp = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
  const author = user ? `${user.firstName} ${user.lastName}` : "Unknown"
  const entry = `[${timestamp} · ${author}] ${text}`

  const updated = wo.internalNotes ? `${wo.internalNotes}\n\n${entry}` : entry

  await prisma.workOrder.update({
    where: { id },
    data: { internalNotes: updated },
  })

  revalidatePath(`/work-orders/${id}`)
  return { success: true }
}
