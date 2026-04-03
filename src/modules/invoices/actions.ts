"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"
import { invoiceSchema, recordPaymentSchema } from "./schemas"
import { calculateTotals, parseLineItemsFromFormData } from "@/modules/estimates/utils"
import { generateInvoiceNumber, generateShareToken } from "@/lib/utils/sequence"
import type { PaymentMethod } from "@/generated/prisma/enums"

export async function createInvoice(formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "invoices:create")

  const raw = Object.fromEntries(formData)
  const parsed = invoiceSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const customer = await prisma.customer.findFirst({
    where: { id: parsed.data.customerId, tenantId },
  })
  if (!customer) return { error: "Customer not found" }

  const lineItems = parseLineItemsFromFormData(formData)
  const { subtotal, taxAmount, total } = calculateTotals(lineItems, parsed.data.taxRate)
  const invoiceNumber = await generateInvoiceNumber(tenantId)

  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      invoiceNumber,
      customerId: parsed.data.customerId,
      workOrderId: parsed.data.workOrderId || undefined,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      notes: parsed.data.notes || undefined,
      subtotal,
      taxAmount,
      total,
      amountDue: total,
      lineItems: {
        create: lineItems.map((item, idx) => ({
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          sortOrder: item.sortOrder ?? idx,
        })),
      },
    },
  })

  revalidatePath("/invoices")
  redirect(`/invoices/${invoice.id}`)
}

export async function voidInvoice(id: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "invoices:void")

  const existing = await prisma.invoice.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Invoice not found" }
  if (existing.status === "PAID") return { error: "Cannot void a paid invoice" }

  await prisma.invoice.update({
    where: { id },
    data: { status: "VOID" },
  })

  revalidatePath(`/invoices/${id}`)
  revalidatePath("/invoices")
}

export async function sendInvoice(id: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "invoices:send")

  const existing = await prisma.invoice.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Invoice not found" }
  if (existing.status === "VOID") return { error: "Cannot send a voided invoice" }

  const shareToken = existing.shareToken ?? generateShareToken()

  await prisma.invoice.update({
    where: { id },
    data: { status: "SENT", sentAt: new Date(), shareToken },
  })

  revalidatePath(`/invoices/${id}`)
  return { shareToken }
}

export async function recordPayment(invoiceId: string, formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "payments:record")

  const existing = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } })
  if (!existing) return { error: "Invoice not found" }
  if (existing.status === "VOID") return { error: "Cannot add payment to a voided invoice" }
  if (existing.status === "PAID") return { error: "Invoice is already fully paid" }

  const raw = Object.fromEntries(formData)
  const parsed = recordPaymentSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { amount, method, reference, notes } = parsed.data
  const total = existing.total.toNumber()
  const currentPaid = existing.amountPaid.toNumber()
  const newAmountPaid = parseFloat((currentPaid + amount).toFixed(2))

  if (newAmountPaid > total) {
    return { error: `Payment of ${amount} exceeds the remaining balance of ${(total - currentPaid).toFixed(2)}` }
  }

  const newAmountDue = parseFloat((total - newAmountPaid).toFixed(2))
  const newStatus =
    newAmountDue <= 0
      ? "PAID"
      : newAmountPaid > 0
      ? "PARTIALLY_PAID"
      : existing.status

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        tenantId,
        invoiceId,
        amount,
        method: method as PaymentMethod,
        reference: reference || undefined,
        notes: notes || undefined,
      },
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus as never,
        paidAt: newStatus === "PAID" ? new Date() : undefined,
      },
    }),
  ])

  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath("/invoices")
}

/** Create an invoice directly from a work order, copying its line items */
export async function createInvoiceFromWorkOrder(workOrderId: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "invoices:create")

  const wo = await prisma.workOrder.findFirst({
    where: { id: workOrderId, tenantId },
    include: { lineItems: true },
  })
  if (!wo) return { error: "Work order not found" }

  const existing = await prisma.invoice.findFirst({ where: { workOrderId } })
  if (existing) return { error: "Invoice already exists for this work order" }

  const invoiceNumber = await generateInvoiceNumber(tenantId)

  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      invoiceNumber,
      customerId: wo.customerId,
      workOrderId: wo.id,
      subtotal: wo.subtotal,
      taxAmount: wo.taxAmount,
      total: wo.total,
      amountDue: wo.total,
      lineItems: {
        create: wo.lineItems.map((item) => ({
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          sortOrder: item.sortOrder,
        })),
      },
    },
  })

  revalidatePath(`/work-orders/${workOrderId}`)
  revalidatePath("/invoices")
  redirect(`/invoices/${invoice.id}`)
}
