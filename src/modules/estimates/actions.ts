"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"
import { estimateSchema } from "./schemas"
import { calculateTotals, parseLineItemsFromFormData } from "./utils"
import { generateEstimateNumber, generateShareToken } from "@/lib/utils/sequence"

export async function createEstimate(formData: FormData) {
  const { tenantId, id: userId, role } = await requireAuth()
  requirePermission(role, "estimates:create")

  const raw = Object.fromEntries(formData)
  const parsed = estimateSchema.safeParse(raw)
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
  const { subtotal, taxAmount, total } = calculateTotals(lineItems, parsed.data.taxRate)
  const estimateNumber = await generateEstimateNumber(tenantId)

  const estimate = await prisma.estimate.create({
    data: {
      tenantId,
      estimateNumber,
      customerId: parsed.data.customerId,
      vehicleId: parsed.data.vehicleId,
      createdById: userId,
      notes: parsed.data.notes || undefined,
      internalNotes: parsed.data.internalNotes || undefined,
      subtotal,
      taxAmount,
      total,
      lineItems: {
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
      },
    },
  })

  // Save initial version snapshot
  await prisma.estimateVersion.create({
    data: {
      estimateId: estimate.id,
      version: 1,
      snapshot: {
        lineItems,
        subtotal,
        taxAmount,
        total,
        notes: parsed.data.notes,
      },
    },
  })

  revalidatePath("/estimates")
  redirect(`/estimates/${estimate.id}`)
}

export async function updateEstimate(id: string, formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "estimates:update")

  const existing = await prisma.estimate.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Estimate not found" }
  if (existing.status === "CONVERTED") return { error: "Cannot edit a converted estimate" }

  const raw = Object.fromEntries(formData)
  const parsed = estimateSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const lineItems = parseLineItemsFromFormData(formData)
  const { subtotal, taxAmount, total } = calculateTotals(lineItems, parsed.data.taxRate)
  const newVersion = existing.version + 1

  await prisma.$transaction([
    prisma.estimateLineItem.deleteMany({ where: { estimateId: id } }),
    prisma.estimate.update({
      where: { id },
      data: {
        notes: parsed.data.notes || undefined,
        internalNotes: parsed.data.internalNotes || undefined,
        subtotal,
        taxAmount,
        total,
        version: newVersion,
        lineItems: {
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
        },
      },
    }),
    prisma.estimateVersion.create({
      data: {
        estimateId: id,
        version: newVersion,
        snapshot: {
          lineItems,
          subtotal,
          taxAmount,
          total,
          notes: parsed.data.notes,
        },
      },
    }),
  ])

  revalidatePath(`/estimates/${id}`)
  revalidatePath("/estimates")
  redirect(`/estimates/${id}`)
}

export async function deleteEstimate(id: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "estimates:delete")

  const existing = await prisma.estimate.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Estimate not found" }
  if (existing.status === "CONVERTED") return { error: "Cannot delete a converted estimate" }

  await prisma.estimate.delete({ where: { id } })

  revalidatePath("/estimates")
  redirect("/estimates")
}

export async function sendEstimate(id: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "estimates:send")

  const existing = await prisma.estimate.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Estimate not found" }
  if (existing.status === "CONVERTED") return { error: "Estimate already converted" }

  const shareToken = existing.shareToken ?? generateShareToken()

  await prisma.estimate.update({
    where: { id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      shareToken,
    },
  })

  revalidatePath(`/estimates/${id}`)
  return { shareToken }
}

/** Called from the customer portal (public, no auth) */
export async function respondToEstimate(
  token: string,
  response: "APPROVED" | "DECLINED"
) {
  const estimate = await prisma.estimate.findUnique({ where: { shareToken: token } })
  if (!estimate) return { error: "Estimate not found" }
  if (!["SENT", "VIEWED"].includes(estimate.status)) {
    return { error: "This estimate is no longer open for response" }
  }

  await prisma.estimate.update({
    where: { shareToken: token },
    data: {
      status: response,
      approvedAt: response === "APPROVED" ? new Date() : undefined,
    },
  })

  return { success: true }
}
