"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"
import { estimateSchema } from "./schemas"
import { calculateTotals, parseLineItemsFromFormData } from "./utils"
import { generateEstimateNumber, generateShareToken } from "@/lib/utils/sequence"
import { emailProvider, estimateEmail } from "@/lib/integrations/email"
import { formatCurrency } from "@/lib/utils/format"

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

  const existing = await prisma.estimate.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      vehicle: true,
    },
  })
  if (!existing) return { error: "Estimate not found" }
  if (existing.status === "CONVERTED") return { error: "Estimate already converted" }

  const shareToken = existing.shareToken ?? generateShareToken()

  const sentAt = new Date()
  const expiresAt = new Date(sentAt)
  expiresAt.setDate(expiresAt.getDate() + 30)

  await prisma.estimate.update({
    where: { id },
    data: { status: "SENT", sentAt, shareToken, expiresAt },
  })

  // Send email if customer has an email address
  if (existing.customer.email) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const vehicleLabel = [existing.vehicle.year, existing.vehicle.make, existing.vehicle.model]
      .filter(Boolean)
      .join(" ")

    const { subject, html } = estimateEmail({
      shopName: tenant?.name ?? "Your Auto Shop",
      shopPhone: tenant?.phone,
      shopEmail: tenant?.email,
      customerFirstName: existing.customer.firstName,
      estimateNumber: existing.estimateNumber,
      vehicleLabel: vehicleLabel || "your vehicle",
      subtotal: formatCurrency(existing.subtotal.toNumber()),
      total: formatCurrency(existing.total.toNumber()),
      portalUrl: `${appUrl}/customer-portal/estimates/${shareToken}`,
    })

    await emailProvider.send({
      to: existing.customer.email,
      subject,
      html,
      replyTo: tenant?.email ?? undefined,
    })
  }

  revalidatePath(`/estimates/${id}`)
  return { shareToken }
}

export async function markEstimateApproved(id: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "estimates:update")

  const existing = await prisma.estimate.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Estimate not found" }
  if (!["SENT", "VIEWED", "DECLINED"].includes(existing.status)) {
    return { error: "Estimate cannot be approved from its current status" }
  }

  await prisma.estimate.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date() },
  })

  revalidatePath(`/estimates/${id}`)
  revalidatePath("/estimates")
}

export async function duplicateEstimate(id: string) {
  const { tenantId, id: userId, role } = await requireAuth()
  requirePermission(role, "estimates:create")

  const source = await prisma.estimate.findFirst({
    where: { id, tenantId },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  })
  if (!source) return { error: "Estimate not found" }

  const estimateNumber = await generateEstimateNumber(tenantId)

  const newEstimate = await prisma.estimate.create({
    data: {
      tenantId,
      estimateNumber,
      customerId: source.customerId,
      vehicleId: source.vehicleId,
      createdById: userId,
      notes: source.notes ?? undefined,
      internalNotes: undefined,
      subtotal: source.subtotal,
      taxAmount: source.taxAmount,
      total: source.total,
      lineItems: {
        create: source.lineItems.map((item) => ({
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          laborHours: item.laborHours ?? undefined,
          partNumber: item.partNumber ?? undefined,
          sortOrder: item.sortOrder,
        })),
      },
    },
  })

  await prisma.estimateVersion.create({
    data: {
      estimateId: newEstimate.id,
      version: 1,
      snapshot: {
        lineItems: source.lineItems,
        subtotal: source.subtotal,
        taxAmount: source.taxAmount,
        total: source.total,
        notes: source.notes,
      },
    },
  })

  revalidatePath("/estimates")
  redirect(`/estimates/${newEstimate.id}`)
}

/** Called from the customer portal (public, no auth) */
export async function respondToEstimate(token: string, response: "APPROVED" | "DECLINED") {
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
