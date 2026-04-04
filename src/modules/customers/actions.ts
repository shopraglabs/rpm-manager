"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"
import { customerSchema, normalizeCustomerInput } from "./schemas"

export async function createCustomer(formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "customers:create")

  const raw = Object.fromEntries(formData)
  const parsed = customerSchema.safeParse({ ...raw, tags: [] })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const customer = await prisma.customer.create({
    data: {
      tenantId,
      ...normalizeCustomerInput(parsed.data),
    },
  })

  revalidatePath("/customers")
  redirect(`/customers/${customer.id}`)
}

export async function updateCustomer(id: string, formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "customers:update")

  const raw = Object.fromEntries(formData)
  const parsed = customerSchema.safeParse({ ...raw, tags: [] })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  // Verify ownership before update
  const existing = await prisma.customer.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Customer not found" }

  await prisma.customer.update({
    where: { id },
    data: normalizeCustomerInput(parsed.data),
  })

  revalidatePath(`/customers/${id}`)
  revalidatePath("/customers")
  redirect(`/customers/${id}`)
}

export async function deleteCustomer(id: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "customers:delete")

  const existing = await prisma.customer.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Customer not found" }

  await prisma.customer.delete({ where: { id } })

  revalidatePath("/customers")
  redirect("/customers")
}

export async function sendCustomerSms(customerId: string, message: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "customers:update")

  if (!message.trim()) return { error: "Message cannot be empty" }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId },
    select: { phone: true, firstName: true, lastName: true },
  })
  if (!customer) return { error: "Customer not found" }
  if (!customer.phone) return { error: "This customer has no phone number on file" }

  const { smsProvider } = await import("@/lib/integrations/sms")
  const result = await smsProvider.send({ to: customer.phone, body: message })
  if (!result.success) return { error: result.error ?? "SMS failed to send" }

  return { success: true }
}
